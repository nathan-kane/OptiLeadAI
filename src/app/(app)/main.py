import os
import asyncio
import logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("twilio-elevenlabs-bridge")
import websockets
print("=== CASCADE DEBUG: THIS IS THE LATEST BUILD ===", flush=True)
print("WEBSOCKETS VERSION:", websockets.__version__, flush=True)
print("FASTAPI APP STARTED", flush=True)
logger.warning("FASTAPI APP STARTED")
import firebase_admin
from firebase_admin import credentials, firestore, initialize_app, get_app
import websockets
import tempfile
import subprocess
from fastapi import FastAPI, WebSocket, Request, HTTPException, Header
from fastapi.responses import Response, JSONResponse, StreamingResponse
from starlette.websockets import WebSocketDisconnect
import re
from datetime import datetime, timedelta
import base64
import json
import uvicorn
from fastapi.middleware.cors import CORSMiddleware

# Initialize FastAPI
app = FastAPI(title="Twilio-ElevenLabs Bridge", version="1.0.0")

# Log startup
@app.on_event("startup")
async def startup_event():
    logger.info("=== STARTING APPLICATION ===")
    logger.info(f"Environment: {os.environ.get('ENVIRONMENT', 'development')}")
    logger.info(f"Port: {os.environ.get('PORT', 8080)}")
    logger.info(f"Routes: {[route.path for route in app.routes]}")
    logger.info("=== APPLICATION STARTED ===")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# SSE Connection Management
active_sse_connections = set()
event_queue = asyncio.Queue()
connection_queues = {}

# Add health check endpoint
@app.get("/health")
def health_check():
    """
    Health check endpoint for Cloud Run.
    Returns 200 if the app is running and ready to serve requests.
    """
    logger.info("Health check request received")
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

# Add root endpoint
@app.get("/")
def index():
    logger.info("Root endpoint hit")
    return {"status": "ok"}

# SSE Endpoint for Call Events
@app.get("/api/call-events")
async def call_events_stream():
    """Server-Sent Events endpoint for real-time call completion notifications"""
    async def event_generator():
        connection_id = id(asyncio.current_task())
        active_sse_connections.add(connection_id)
        logging.info(f"New SSE connection established: {connection_id}")
        
        # Create a local queue for this connection
        local_queue = asyncio.Queue()
        connection_queues[connection_id] = local_queue
        
        try:
            # Send initial connection confirmation
            yield f"data: {json.dumps({'type': 'connected', 'timestamp': datetime.utcnow().isoformat()})}\n\n"
            
            # Listen for events
            while True:
                try:
                    # Wait for event with timeout for heartbeat
                    event = await asyncio.wait_for(local_queue.get(), timeout=30.0)
                    yield f"data: {json.dumps(event)}\n\n"
                except asyncio.TimeoutError:
                    # Send heartbeat
                    yield f"data: {json.dumps({'type': 'heartbeat', 'timestamp': datetime.utcnow().isoformat()})}\n\n"
                
        except Exception as e:
            logging.warning(f"SSE connection {connection_id} disconnected: {e}")
        finally:
            active_sse_connections.discard(connection_id)
            if connection_id in connection_queues:
                del connection_queues[connection_id]
            logging.info(f"SSE connection {connection_id} removed")
    
    return StreamingResponse(
        event_generator(), 
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Cache-Control"
        }
    )

# Function to notify all SSE clients
async def notify_call_ended(call_data):
    """Send call completion notification to all connected SSE clients"""
    if not active_sse_connections:
        logging.info("No active SSE connections to notify")
        return
    
    event_data = {
        "type": "call_ended",
        "timestamp": datetime.utcnow().isoformat(),
        "data": call_data
    }
    
    # Add event to global queue
    try:
        await event_queue.put(event_data)
        logging.info(f"Call ended notification queued for {len(active_sse_connections)} connections")
        logging.info(f"Call data: {call_data}")
    except Exception as e:
        logging.error(f"Error queuing call ended notification: {e}")

# Periodically send events from the global queue to all connected clients
async def send_events_periodically():
    while True:
        try:
            event = await event_queue.get()
            # Send event to all connected clients
            for connection_id, queue in list(connection_queues.items()):
                try:
                    await queue.put(event)
                except Exception as e:
                    logging.warning(f"Failed to send event to connection {connection_id}: {e}")
        except Exception as e:
            logging.error(f"Error in send_events_periodically: {e}")
            await asyncio.sleep(1)

# Initialize the event broadcasting task on startup
@app.on_event("startup")
async def initialize_sse_broadcasting():
    asyncio.create_task(send_events_periodically())
    logging.info("SSE event broadcasting task started")

# CONFIGURATION
# Set to True to send raw μ-law audio to ElevenLabs (recommended for μ-law 8kHz agent mode)
SEND_RAW_ULAW = os.getenv("SEND_RAW_ULAW", "1") == "1"
logging.warning(f"SEND_RAW_ULAW mode: {SEND_RAW_ULAW}")
# Make sure your ElevenLabs agent Input and Output format are both set to μ-law 8kHz!
TWILIO_STREAM_PATH = "/twilio-media"
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "YOUR_ELEVENLABS_API_KEY")
AGENT_ID = os.getenv("ELEVENLABS_AGENT_ID", "YOUR_AGENT_ID")

# Utility: Convert Twilio PCM μ-law 8kHz mono to PCM 16kHz mono (WAV)
def convert_ulaw_to_pcm16(audio_bytes):
    import tempfile, subprocess, os, logging
    with tempfile.NamedTemporaryFile(delete=False, suffix=".ulaw") as in_file:
        in_file.write(audio_bytes)
        in_file.flush()
        out_path = in_file.name + ".pcm"
        cmd = [
            "ffmpeg", "-y", "-f", "mulaw", "-ar", "8000", "-ac", "1", "-i", in_file.name,
            "-ar", "16000", "-ac", "1", "-f", "s16le", out_path
        ]
        result = subprocess.run(cmd, capture_output=True)
        if result.returncode != 0:
            logging.error(f"ffmpeg error in convert_ulaw_to_pcm16: {result.stderr.decode()}")
            os.remove(in_file.name)
            return b""
        if not os.path.exists(out_path):
            logging.error(f"ffmpeg did not create output file: {out_path}")
            os.remove(in_file.name)
            return b""
        with open(out_path, "rb") as out_file:
            pcm16 = out_file.read()
        logging.warning(f"convert_ulaw_to_pcm16: returning raw PCM16, len={len(pcm16)}, first20={pcm16[:20].hex()}")
        os.remove(in_file.name)
        os.remove(out_path)
        return pcm16

# Utility: Convert PCM 16kHz mono (WAV) to μ-law 8kHz mono for Twilio
def convert_pcm16_to_ulaw(audio_bytes):
    import tempfile
    import subprocess
    import logging
    import os
    logging.warning(f"convert_pcm16_to_ulaw: type={type(audio_bytes)}, len={len(audio_bytes)}, first100={audio_bytes[:100]}")
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as in_file:
        in_file.write(audio_bytes)
        in_file.flush()
        out_path = in_file.name + ".ulaw"
        cmd = [
            "ffmpeg", "-y", "-f", "wav", "-ar", "16000", "-ac", "1", "-i", in_file.name,
            "-ar", "8000", "-ac", "1", "-f", "mulaw", out_path
        ]
        result = subprocess.run(cmd, capture_output=True)
        if result.returncode != 0:
            logging.error(f"ffmpeg error in convert_pcm16_to_ulaw: {result.stderr.decode()}")
            os.remove(in_file.name)
            return b""  # Return empty bytes on error
        if not os.path.exists(out_path):
            logging.error(f"ffmpeg did not create output file: {out_path}")
            os.remove(in_file.name)
            return b""
        with open(out_path, "rb") as out_file:
            ulaw = out_file.read()
        os.remove(in_file.name)
        os.remove(out_path)
        return ulaw

@app.post("/twilio-voice")
def twilio_voice(request: Request):
    host = os.getenv("HOST", "twilio-elevenlabs-bridge-295347007268.us-central1.run.app")
    
    # Extract prospect name from query parameters if provided
    prospect_name = request.query_params.get("prospect_name")
    
    # Build WebSocket URL with prospect name if provided
    ws_url = f"wss://{host}{TWILIO_STREAM_PATH}"
    if prospect_name:
        import urllib.parse
        ws_url = f"wss://{host}{TWILIO_STREAM_PATH}?prospect_name={urllib.parse.quote(prospect_name)}"
        logging.info(f"TwiML generated with prospect name: {prospect_name}")
    
    twiml = f'''<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Start>
        <Stream url="{ws_url}" />
    </Start>
</Response>'''
    return Response(content=twiml, media_type="text/xml")

import base64
import json

import logging

@app.websocket(TWILIO_STREAM_PATH)
async def twilio_media_ws(websocket: WebSocket):
    logging.warning("WebSocket connection attempt at /twilio-media")
    
    # Extract prospect name from query parameters
    prospect_name = websocket.query_params.get("prospect_name")
    if prospect_name:
        logging.info(f"WebSocket connection with prospect name: {prospect_name}")
    
    await websocket.accept()
    import httpx
    
    # Prepare dynamic variables for ElevenLabs agent
    dynamic_variables = {}
    if prospect_name:
        dynamic_variables["prospect_name"] = prospect_name
        # Create a personalized system prompt
        system_prompt = f"You are Alexis, a friendly real estate agent calling {prospect_name}. Be warm and professional. Use their name naturally in conversation when appropriate."
        dynamic_variables["system_prompt"] = system_prompt
        logging.info(f"Using personalized system prompt for {prospect_name}")
    
    # Get signed URL for private agent with dynamic variables
    signed_url = None
    try:
        async with httpx.AsyncClient() as client:
            # Build request with dynamic variables if available
            url = f"https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id={AGENT_ID}"
            payload = {}
            if dynamic_variables:
                payload["dynamic_variables"] = dynamic_variables
            
            if payload:
                resp = await client.post(
                    url,
                    headers={"xi-api-key": ELEVENLABS_API_KEY},
                    json=payload
                )
            else:
                resp = await client.get(
                    url,
                    headers={"xi-api-key": ELEVENLABS_API_KEY}
                )
            
            resp.raise_for_status()
            signed_url = resp.json().get("signed_url")
            if not signed_url:
                raise Exception(f"No signed_url in ElevenLabs response: {resp.text}")
    except Exception as e:
        logging.error(f"Failed to get signed ElevenLabs URL: {e}")
        await websocket.close()
        return
    try:
        # Connect to ElevenLabs using signed URL (no headers)
        logging.warning("Connecting to ElevenLabs WebSocket...")
        async with websockets.connect(signed_url) as el_ws:
            logging.warning("Connected to ElevenLabs WebSocket!")
            # Send initial message to ElevenLabs to trigger audio generation
            initial_text = "Hello, how can I help you?"  # You can customize or make this dynamic
            initial_msg = json.dumps({
                "text": initial_text,
                "flush": True
            })
            await el_ws.send(initial_msg)
            logging.warning(f"Sent initial message to ElevenLabs: {initial_msg}")
            logging.info("[twilio_media_ws] Audio streaming pipeline ready: Twilio <-> ElevenLabs")
            async def twilio_to_elevenlabs():
                logging.warning(f"Started twilio_to_elevenlabs task (audio chunk mode, SEND_RAW_ULAW={SEND_RAW_ULAW})")
                try:
                    while True:
                        msg = await websocket.receive_text()
                        logging.info(f"[twilio_to_elevenlabs] Received message from Twilio: {msg[:100]}")
                        try:
                            data = json.loads(msg)
                            if data.get("event") == "media":
                                audio_b64 = data["media"]["payload"]
                                audio_bytes = base64.b64decode(audio_b64)
                                logging.info(f"[twilio_to_elevenlabs] Decoded μ-law audio chunk from Twilio: {len(audio_bytes)} bytes, first20={audio_bytes[:20].hex()}")
                                if SEND_RAW_ULAW:
                                    # Send raw μ-law 8kHz mono as user_audio_chunk
                                    chunk_b64 = base64.b64encode(audio_bytes).decode()
                                    user_audio_msg = json.dumps({
                                        "type": "user_audio_chunk",
                                        "user_audio_chunk": chunk_b64
                                    })
                                    logging.info(f"[twilio_to_elevenlabs][ULAW MODE] Sending μ-law chunk to ElevenLabs: {len(audio_bytes)} bytes, first20={audio_bytes[:20].hex()}")
                                else:
                                    # Convert μ-law 8kHz mono to PCM 16kHz mono
                                    pcm16 = convert_ulaw_to_pcm16(audio_bytes)
                                    chunk_b64 = base64.b64encode(pcm16).decode()
                                    user_audio_msg = json.dumps({
                                        "type": "user_audio_chunk",
                                        "user_audio_chunk": chunk_b64
                                    })
                                    logging.info(f"[twilio_to_elevenlabs][PCM16 MODE] Sending PCM16 chunk to ElevenLabs: {len(pcm16)} bytes, first20={pcm16[:20].hex()}")
                                await el_ws.send(user_audio_msg)
                                logging.info(f"[twilio_to_elevenlabs] Sent audio chunk to ElevenLabs: {len(user_audio_msg)} bytes")
                        except Exception as e:
                            logging.error(f"[twilio_to_elevenlabs] Error processing/sending Twilio audio chunk: {e}")
                except WebSocketDisconnect:
                    logging.warning("[twilio_to_elevenlabs] WebSocketDisconnect in twilio_to_elevenlabs")
                except Exception as e:
                    logging.error(f"[twilio_to_elevenlabs] Exception in twilio_to_elevenlabs: {e}")
            async def elevenlabs_to_twilio():
                logging.warning("Started elevenlabs_to_twilio task")
                try:
                    while True:
                        msg = await el_ws.recv()
                        logging.info(f"[elevenlabs_to_twilio] Received message from ElevenLabs: {msg[:200]}")
                        try:
                            data = json.loads(msg)
                            if "audio_base_64" in data:
                                audio_bytes = base64.b64decode(data["audio_base_64"])
                                logging.info(f"[elevenlabs_to_twilio] Decoded ElevenLabs audio: {len(audio_bytes)} bytes")
                                ulaw = convert_pcm16_to_ulaw(audio_bytes)
                                logging.info(f"[elevenlabs_to_twilio] Converted to μ-law: {len(ulaw)} bytes")
                                payload_b64 = base64.b64encode(ulaw).decode()
                                frame = {
                                    "event": "media",
                                    "media": {"payload": payload_b64}
                                }
                                await websocket.send_bytes(json.dumps(frame).encode('utf-8'))
                                logging.info(f"[elevenlabs_to_twilio] Sent audio chunk to Twilio: {len(payload_b64)} bytes")
                        except Exception as e:
                            logging.error(f"[elevenlabs_to_twilio] Error handling ElevenLabs message: {e}")
                except Exception as e:
                    logging.error(f"[elevenlabs_to_twilio] Error in elevenlabs_to_twilio: {e}")
            await asyncio.gather(twilio_to_elevenlabs(), elevenlabs_to_twilio())
    except Exception as e:
        logging.error(f"WebSocket connection error at /twilio-media: {e}")
        logging.error("Failed to connect or lost connection to ElevenLabs WebSocket!")
    finally:
        logging.warning("WebSocket connection closed at /twilio-media")


from pydantic import BaseModel
import httpx
import logging

class StartCallRequest(BaseModel):
    phone_number: str
    voice_id: str
    prospect_name: str = None  # Optional - name of the person being called
    system_prompt: str = None  # Optional

from fastapi import Request
from fastapi.responses import JSONResponse
import logging

from twilio.rest import Client
import os

def make_outbound_call(phone_number: str, prospect_name: str = None):
    account_sid = os.getenv("TWILIO_ACCOUNT_SID")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN")
    twilio_number = os.getenv("TWILIO_PHONE_NUMBER")
    twiml_url = os.getenv("TWIML_URL") or "https://twilio-elevenlabs-bridge-295347007268.us-central1.run.app/twilio-voice"
    
    try:
        client = Client(account_sid, auth_token)
        
        # Prepare TwiML URL with prospect name if provided
        call_url = twiml_url
        if prospect_name:
            # Add prospect name as URL parameter for TwiML endpoint
            import urllib.parse
            call_url = f"{twiml_url}?prospect_name={urllib.parse.quote(prospect_name)}"
            logging.info(f"Making call with prospect name: {prospect_name}")
        
        call = client.calls.create(
            to=phone_number,
            from_=twilio_number,
            url=call_url
        )
        logging.info(f"Twilio call started. SID: {call.sid}")
        return {"status": "call started", "sid": call.sid}
    except Exception as e:
        logging.error(f"Twilio call failed: {e}")
        return {"status": "call failed", "error": str(e)}


@app.post("/api/start-call")
async def start_call(request: Request):
    try:
        raw_body = await request.body()
        logging.warning(f"[start-call] Raw request body: {raw_body}")
        data = await request.json()
        logging.warning(f"[start-call] Parsed data: {data}")
        
        # Accept both camelCase and snake_case for compatibility
        phone_number = data.get("phone_number") or data.get("phoneNumber")
        prospect_name = data.get("prospect_name") or data.get("prospectName")
        prompt_id = data.get("prompt_id") or data.get("promptId")
        prompt_name = data.get("prompt_name") or data.get("promptName")
        
        logging.warning(f"[start-call] Received phone_number: {phone_number}")
        logging.warning(f"[start-call] Received prospect_name: {prospect_name}")
        logging.warning(f"[start-call] Received prompt_id: {prompt_id}")
        logging.warning(f"[start-call] Received prompt_name: {prompt_name}")
        
        # E.164 validation: must start with + and 10-15 digits
        import re
        e164_regex = r"^\+\d{10,15}$"
        if not phone_number or not isinstance(phone_number, str) or not re.match(e164_regex, phone_number):
            logging.warning(f"[start-call] Invalid phone number: {phone_number}")
            return JSONResponse(
                status_code=400,
                content={"success": False, "message": "Missing or invalid phone number"},
                headers={"Content-Type": "application/json"}
            )
        
        logging.warning(f"[start-call] Accepted phone number: {phone_number}")
        
        # Apply system prompt if specified
        prompt_applied = "none"
        if prompt_id or prompt_name:
            logging.info(f"[start-call] Applying system prompt: ID={prompt_id}, Name={prompt_name}")
            success, message = await apply_system_prompt_to_agent(prompt_id, prompt_name)
            
            if not success:
                logging.error(f"[start-call] Failed to apply system prompt: {message}")
                return JSONResponse(
                    status_code=400,
                    content={"success": False, "message": f"Failed to apply system prompt: {message}"},
                    headers={"Content-Type": "application/json"}
                )
            
            prompt_applied = prompt_id or prompt_name
            logging.info(f"[start-call] Successfully applied system prompt: {message}")
        else:
            # Use default prompt if no specific prompt is requested
            logging.info("[start-call] No specific prompt requested, checking for default prompt")
            default_prompt = await get_system_prompt()  # Gets default prompt
            if default_prompt:
                success, message = await apply_system_prompt_to_agent()
                if success:
                    prompt_applied = "default"
                    logging.info(f"[start-call] Applied default system prompt: {message}")
                else:
                    logging.warning(f"[start-call] Failed to apply default prompt: {message}")
        
        # Simulate outbound call with prospect name
        result = make_outbound_call(phone_number, prospect_name)
        if result.get("status") == "call started" and "sid" in result:
            return JSONResponse(
                status_code=200,
                content={
                    "success": True, 
                    "message": "Call started", 
                    "sid": result["sid"],
                    "promptApplied": prompt_applied
                },
                headers={"Content-Type": "application/json"}
            )
        else:
            # Twilio call failed or returned error
            error_msg = result.get("error") or "Call failed"
            return JSONResponse(
                status_code=500,
                content={"success": False, "message": error_msg},
                headers={"Content-Type": "application/json"}
            )
    except Exception as e:
        logging.exception(f"Unhandled error in /api/start-call: {e}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": f"Internal server error: {str(e)}"},
            headers={"Content-Type": "application/json"}
        )


        if 'crm_block' in locals() and crm_block:
            try:
                lead_data = json.loads(crm_block)
                logging.warning(f"Parsed lead_data from CRM block: {lead_data}")
            except Exception as e:
                logging.error(f"Error parsing CRM block to JSON: {e}")
                return JSONResponse(status_code=400, content={"success": False, "error": f"Could not parse CRM.save block: {str(e)}"})
            if not lead_data.get("fullName") or not lead_data.get("phoneNumber"):
                logging.warning(f"Missing required fields in CRM block: {lead_data}")
                return JSONResponse(status_code=400, content={"success": False, "error": "Missing required fields: fullName and phoneNumber."})
            doc_data = {k: lead_data.get(k, None) for k in [
                "fullName", "phoneNumber", "status", "timeline", "location", "budget", "financialStatus", "hasAgent", "motivation", "leadQuality", "nextStep"
            ]}
            doc_data["createdAt"] = firestore.SERVER_TIMESTAMP
            logging.warning(f"Extracted lead data (start-call): {doc_data}")
            try:
                doc_ref = db.collection("leads").document()
                doc_ref.set(doc_data)
                logging.warning(f"Saved lead to Firestore with ID (start-call): {doc_ref.id}")
                # Optionally return a success response here if you want
            except Exception as e:
                logging.error(f"Unexpected error in /api/start-call: {e}")
                # Optionally return an error response here if you want

class OutboundCallRequest(BaseModel):
    phone_number: str
    prospect_name: str = None  # Optional - name of the person being called
    system_prompt: str = None  # Optional field for custom system prompt

@app.post("/start-outbound-call")
async def start_outbound_call(payload: OutboundCallRequest):
    try:
        phone_number = payload.phone_number
        prospect_name = payload.prospect_name
        if not phone_number:
            logging.error("Missing phone_number in request.")
            return {"error": "Missing phone_number in request."}
        
        logging.info(f"Starting outbound call to {phone_number}" + (f" for {prospect_name}" if prospect_name else ""))
        
        elevenlabs_api_key = os.getenv("ELEVENLABS_API_KEY")
        agent_id = os.getenv("ELEVENLABS_AGENT_ID")
        agent_phone_number_id = os.getenv("ELEVENLABS_AGENT_PHONE_NUMBER_ID")
        if not all([elevenlabs_api_key, agent_id, agent_phone_number_id]):
            logging.error(f"Missing env vars: ELEVENLABS_API_KEY={elevenlabs_api_key}, ELEVENLABS_AGENT_PHONE_NUMBER_ID={agent_phone_number_id}, ELEVENLABS_AGENT_ID={agent_id}")
            return {"error": "Missing required environment variables."}
        
        payload_dict = {
            "to_number": phone_number,
            "agent_phone_number_id": agent_phone_number_id,
            "agent_id": agent_id
        }
        
        # Handle system prompt and prospect name
        if prospect_name:
            # Create personalized system prompt if prospect name is provided
            personalized_prompt = f"You are Alexis, a friendly real estate agent calling {prospect_name}. Be warm and professional. Use their name naturally in conversation when appropriate."
            
            # Use custom system prompt if provided, otherwise use personalized prompt
            final_prompt = payload.system_prompt if payload.system_prompt else personalized_prompt
            payload_dict["system_prompt"] = final_prompt
            
            # Add dynamic variables for prospect name
            payload_dict["dynamic_variables"] = {
                "prospect_name": prospect_name
            }
            
            logging.info(f"Using personalized system prompt for {prospect_name}")
        elif payload.system_prompt:
            # Use provided system prompt if no prospect name
            payload_dict["system_prompt"] = payload.system_prompt
        headers = {
            "xi-api-key": elevenlabs_api_key,
            "Content-Type": "application/json"
        }
        logging.warning(f"Outbound call payload to ElevenLabs: {payload_dict}")
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://api.elevenlabs.io/v1/convai/twilio/outbound-call",
                json=payload_dict,
                headers=headers
            )
        logging.warning(f"ElevenLabs API response: {resp.status_code} {resp.text}")
        try:
            return resp.json()
        except Exception as e:
            logging.error(f"Error parsing ElevenLabs response: {e}, text={resp.text}")
            return {"status_code": resp.status_code, "text": resp.text}
    except Exception as e:
        logging.exception(f"Exception in /start-outbound-call: {e}")
        return {"error": str(e)}

@app.get("/env-debug")
def env_debug():
    # Only print the first 8 chars of the API key for safety
    return {
        "ELEVENLABS_API_KEY": os.getenv("ELEVENLABS_API_KEY", "NOT SET")[:8] + "...",
        "ELEVENLABS_AGENT_ID": os.getenv("ELEVENLABS_AGENT_ID", "NOT SET")
    }

@app.get("/test-log")
def test_log():
    logging.warning("Test log endpoint hit")
    return {"status": "ok"}

@app.get("/")
def index():
    return {"status": "ok"}

@app.get("/health")
def health_check():
    """
    Health check endpoint for Cloud Run.
    Returns 200 if the app is running and ready to serve requests.
    """
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

# --- Firestore Initialization ---
import json
service_account_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
service_account_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "serviceAccountKey.json")

if service_account_json:
    cred = credentials.Certificate(json.loads(service_account_json))
else:
    cred = credentials.Certificate(service_account_path)

if not firebase_admin._apps:
    firebase_app = initialize_app(cred)
else:
    firebase_app = get_app()
db = firestore.client()

# --- ElevenLabs Agent Configuration ---

async def get_agent_configuration():
    """Fetch current ElevenLabs agent configuration"""
    try:
        agent_id = os.getenv("ELEVENLABS_AGENT_ID")
        api_key = os.getenv("ELEVENLABS_API_KEY")
        
        if not agent_id or not api_key:
            logging.error("Missing ELEVENLABS_AGENT_ID or ELEVENLABS_API_KEY")
            return None
            
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://api.elevenlabs.io/v1/convai/agents/{agent_id}",
                headers={"xi-api-key": api_key}
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                logging.error(f"Failed to fetch agent config: {response.status_code} - {response.text}")
                return None
                
    except Exception as e:
        logging.error(f"Error fetching agent configuration: {e}")
        return None

async def update_agent_with_end_call_tool():
    """Add End Call tool to ElevenLabs agent configuration"""
    try:
        # Get current agent configuration
        current_config = await get_agent_configuration()
        if not current_config:
            return False, "Failed to fetch current agent configuration"
            
        # Check if End Call tool is already configured
        conversation_config = current_config.get("conversation_config", {})
        agent_config = conversation_config.get("agent", {})
        prompt_config = agent_config.get("prompt", {})
        current_tools = prompt_config.get("tools", [])
        
        # Check if end_call tool already exists
        has_end_call = any(
            tool.get("name") == "end_call" and tool.get("type") == "system"
            for tool in current_tools
        )
        
        if has_end_call:
            logging.info("End Call tool already configured for agent")
            return True, "End Call tool already exists"
            
        # Add End Call tool
        end_call_tool = {
            "type": "system",
            "name": "end_call",
            "description": ""  # Empty description uses default behavior
        }
        
        # Update tools list
        updated_tools = current_tools + [end_call_tool]
        
        # Prepare updated configuration
        updated_config = {
            "conversation_config": {
                **conversation_config,
                "agent": {
                    **agent_config,
                    "prompt": {
                        **prompt_config,
                        "tools": updated_tools
                    }
                }
            }
        }
        
        # Update agent via API
        agent_id = os.getenv("ELEVENLABS_AGENT_ID")
        api_key = os.getenv("ELEVENLABS_API_KEY")
        
        async with httpx.AsyncClient() as client:
            response = await client.patch(
                f"https://api.elevenlabs.io/v1/convai/agents/{agent_id}",
                headers={
                    "xi-api-key": api_key,
                    "Content-Type": "application/json"
                },
                json=updated_config
            )
            
            if response.status_code == 200:
                logging.info("Successfully added End Call tool to agent")
                return True, "End Call tool added successfully"
            else:
                logging.error(f"Failed to update agent: {response.status_code} - {response.text}")
                return False, f"API error: {response.status_code} - {response.text}"
                
    except Exception as e:
        logging.error(f"Error updating agent with End Call tool: {e}")
        return False, str(e)

@app.post("/api/configure-end-call-tool")
async def configure_end_call_tool():
    """Endpoint to configure End Call tool for the agent"""
    try:
        success, message = await update_agent_with_end_call_tool()
        
        if success:
            return JSONResponse(
                status_code=200,
                content={"success": True, "message": message}
            )
        else:
            return JSONResponse(
                status_code=400,
                content={"success": False, "error": message}
            )
            
    except Exception as e:
        logging.error(f"Error in configure-end-call-tool endpoint: {e}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)}
        )

@app.get("/api/agent-config")
async def get_agent_config():
    """Endpoint to view current agent configuration"""
    try:
        config = await get_agent_configuration()
        
        if config:
            # Extract tools for easy viewing
            conversation_config = config.get("conversation_config", {})
            agent_config = conversation_config.get("agent", {})
            prompt_config = agent_config.get("prompt", {})
            tools = prompt_config.get("tools", [])
            
            return JSONResponse(
                status_code=200,
                content={
                    "success": True,
                    "agent_id": config.get("agent_id"),
                    "name": config.get("name"),
                    "tools": tools,
                    "has_end_call_tool": any(
                        tool.get("name") == "end_call" and tool.get("type") == "system"
                        for tool in tools
                    )
                }
            )
        else:
            return JSONResponse(
                status_code=400,
                content={"success": False, "error": "Failed to fetch agent configuration"}
            )
            
    except Exception as e:
        logging.error(f"Error in agent-config endpoint: {e}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)}
        )

# --- Shared Lead Extraction and Save Logic ---
def parse_conversation_for_lead_data(transcript: str):
    """Enhanced fallback parser to extract lead data from unstructured conversation transcript"""
    try:
        logging.warning(f"[PARSER-DEBUG] Starting fallback parser with transcript length: {len(transcript)}")
        logging.warning(f"[PARSER-DEBUG] First 500 chars: {transcript[:500]}")
        
        lead_data = {}
        
        # Extract phone number from transcript (usually in system variables or mentioned)
        phone_match = re.search(r'\+1\d{10}', transcript)
        if phone_match:
            lead_data['phoneNumber'] = phone_match.group()
        
        # Extract name - comprehensive patterns
        name_patterns = [
            r'my name is ([A-Za-z]+(?:\s+[A-Za-z]+)*)',
            r'I\'m ([A-Za-z]+(?:\s+[A-Za-z]+)*)',
            r'this is ([A-Za-z]+(?:\s+[A-Za-z]+)*)',
            r'calling ([A-Za-z]+(?:\s+[A-Za-z]+)*)',
            r'Hi,?\s+([A-Za-z]+)',
            r'Hello,?\s+([A-Za-z]+)',
            r'speaking with ([A-Za-z]+(?:\s+[A-Za-z]+)*)',
            r'user:\s*([A-Za-z]+)(?:[,\.!\?]|\s|$)',
            r'agent:.*?([A-Za-z]+)(?:,|\.|!|\?)',
            r'name.*?is.*?([A-Za-z]+(?:\s+[A-Za-z]+)*)',
            r'call.*?me.*?([A-Za-z]+)',
            r'([A-Za-z]+)\s+speaking',
            r'([A-Za-z]+)\s+here'
        ]
        for pattern in name_patterns:
            name_match = re.search(pattern, transcript, re.I)
            if name_match:
                potential_name = name_match.group(1).strip()
                excluded_words = ['hello', 'hi', 'yes', 'no', 'okay', 'sure', 'thanks', 'thank', 'alexis', 'agent', 'user', 'calling', 'speaking', 'name', 'here', 'there', 'what', 'how', 'when', 'where', 'why', 'good', 'great', 'fine', 'well']
                if (potential_name.lower() not in excluded_words and 
                    len(potential_name) >= 2 and 
                    potential_name.isalpha()):
                    lead_data['fullName'] = potential_name.title()
                    logging.warning(f"[PARSER-DEBUG] Found name: {lead_data['fullName']}")
                    break
        
        # Extract status - comprehensive buy/sell/rent patterns
        # Check for SELLING intent first (often less common)
        selling_patterns = [
            r'looking to sell|want to sell|selling|interested in selling',
            r'list.*(?:property|house|home|condo)',
            r'sell.*(?:house|home|property|condo)',
            r'put.*(?:house|home|property).*(?:market|sale)',
            r'thinking.*(?:selling|sell)',
            r'ready.*sell',
            r'need.*sell',
            r'have.*(?:house|home|property).*sell',
            r'own.*(?:house|home|property).*sell',
            r'current.*(?:house|home|property).*sell',
            r'existing.*(?:house|home|property).*sell'
        ]
        
        # Check for RENTING intent
        renting_patterns = [
            r'looking to rent|want to rent|renting|interested in renting',
            r'rental|lease|leasing',
            r'rent.*(?:house|home|apartment|condo|place)',
            r'looking.*rental',
            r'need.*rent',
            r'apartment.*rent',
            r'monthly.*rent',
            r'lease.*(?:house|home|apartment)',
            r'tenant|renter'
        ]
        
        # Check for BUYING intent (most common, check last)
        buying_patterns = [
            r'looking to buy|want to buy|buying|interested in buying',
            r'purchase|purchasing',
            r'buy.*(?:house|home|property|condo)',
            r'looking.*(?:house|home|property|condo)',
            r'shopping.*(?:house|home|property)',
            r'house.*hunt|home.*hunt|property.*hunt',
            r'first.*time.*buyer',
            r'ready.*buy',
            r'need.*buy',
            r'thinking.*buying',
            r'market.*(?:house|home|property)',
            r'real.*estate.*(?:buy|purchase)',
            r'move.*(?:buy|purchase)',
            r'upgrade.*(?:house|home)',
            r'downsize.*(?:house|home)',
            r'relocat.*(?:buy|purchase)',
            r'new.*(?:house|home|property)',
            r'find.*(?:house|home|property)',
            r'search.*(?:house|home|property)'
        ]
        
        # Check patterns in order of specificity
        status_found = False
        
        # Check selling patterns first
        for pattern in selling_patterns:
            if re.search(pattern, transcript, re.I):
                lead_data['status'] = 'Seller'
                logging.warning(f"[PARSER-DEBUG] Found status: Seller")
                status_found = True
                break
        
        # Check renting patterns if not selling
        if not status_found:
            for pattern in renting_patterns:
                if re.search(pattern, transcript, re.I):
                    lead_data['status'] = 'Renter'
                    logging.warning(f"[PARSER-DEBUG] Found status: Renter")
                    status_found = True
                    break
        
        # Check buying patterns if not selling or renting
        if not status_found:
            for pattern in buying_patterns:
                if re.search(pattern, transcript, re.I):
                    lead_data['status'] = 'Buyer'
                    logging.warning(f"[PARSER-DEBUG] Found status: Buyer")
                    status_found = True
                    break
        
        # If no specific intent found, try to infer from context
        if not status_found:
            if re.search(r'mortgage|financing|loan|pre.*approved|down.*payment|closing', transcript, re.I):
                lead_data['status'] = 'Buyer'
                logging.warning(f"[PARSER-DEBUG] Found status: Buyer (inferred from financial terms)")
            elif re.search(r'agent.*list|realtor.*list|commission|market.*value', transcript, re.I):
                lead_data['status'] = 'Seller'
                logging.warning(f"[PARSER-DEBUG] Found status: Seller (inferred from listing terms)")
            elif re.search(r'deposit|lease.*term|monthly|landlord', transcript, re.I):
                lead_data['status'] = 'Renter'
                logging.warning(f"[PARSER-DEBUG] Found status: Renter (inferred from rental terms)")
        
        # Enhanced timeline extraction with comprehensive patterns
        timeline_patterns = [
            # Specific timeframes with numbers
            r'(within|in the|next|in)\s+(\w+\s+(?:months?|weeks?|years?))',
            r'(\d+)\s+(months?|weeks?|years?)',
            r'(\d+)\s*-\s*(\d+)\s+(months?|years?)',  # "3-6 months"
            
            # Common specific timeframes
            r'(six months|6 months|three months|3 months|one year|1 year|two years|2 years)',
            r'(immediately|ASAP|as soon as possible|right away|soon|quickly)',
            r'(couple.*months|few.*months|several.*months)',
            r'(couple.*years|few.*years)',
            
            # Seasonal and calendar references
            r'(next\s+(?:spring|summer|fall|winter|year))',
            r'(by\s+(?:spring|summer|fall|winter|\w+\s+\d{4}))',
            r'(this\s+(?:spring|summer|fall|winter|year|month))',
            r'(end\s+of\s+(?:year|\d{4}|spring|summer|fall|winter))',
            r'(beginning\s+of\s+(?:year|\d{4}|spring|summer|fall|winter))',
            
            # Relative timeframes
            r'(not\s+(?:rush|hurry|immediate))',
            r'(no\s+(?:rush|hurry|timeline))',
            r'(flexible\s+(?:timeline|timeframe))',
            r'(when\s+(?:ready|find|right))',
            r'(eventually|someday|future)',
            
            # Life event driven
            r'(when\s+(?:lease|contract)\s+(?:ends|expires|up))',
            r'(after\s+(?:graduation|retirement|job|work))',
            r'(before\s+(?:school|baby|wedding|move))',
            
            # Market condition driven
            r'(when\s+(?:market|rates|prices)\s+(?:improve|drop|stabilize))',
            r'(if\s+(?:market|rates|prices)\s+(?:improve|drop|good))',
            
            # General urgency indicators
            r'(urgent|emergency|must\s+move)',
            r'(not\s+urgent|no\s+hurry)',
            r'(taking\s+(?:time|while))',
            r'(exploring\s+options)',
            r'(just\s+(?:looking|browsing|starting))'
        ]
        
        timeline_found = False
        for pattern in timeline_patterns:
            timeline_match = re.search(pattern, transcript, re.I)
            if timeline_match:
                timeline_text = timeline_match.group().strip()
                
                # Clean up and standardize timeline text
                if len(timeline_text) > 50:  # Limit very long matches
                    timeline_text = timeline_text[:50] + "..."
                
                # Standardize common phrases
                timeline_lower = timeline_text.lower()
                if any(word in timeline_lower for word in ['asap', 'immediately', 'right away', 'soon']):
                    lead_data['timeline'] = 'Immediately'
                elif any(word in timeline_lower for word in ['no rush', 'no hurry', 'flexible', 'eventually']):
                    lead_data['timeline'] = 'Flexible timeline'
                elif any(word in timeline_lower for word in ['just looking', 'just browsing', 'exploring']):
                    lead_data['timeline'] = 'Just browsing'
                elif 'couple' in timeline_lower and 'month' in timeline_lower:
                    lead_data['timeline'] = 'Few months'
                elif 'few' in timeline_lower and 'month' in timeline_lower:
                    lead_data['timeline'] = 'Few months'
                elif 'several' in timeline_lower and 'month' in timeline_lower:
                    lead_data['timeline'] = 'Several months'
                else:
                    lead_data['timeline'] = timeline_text
                
                logging.warning(f"[PARSER-DEBUG] Found timeline: {lead_data['timeline']}")
                timeline_found = True
                break
        
        # If no timeline found, look for contextual clues
        if not timeline_found:
            if re.search(r'pre.*approved|ready.*buy|cash.*buyer', transcript, re.I):
                lead_data['timeline'] = 'Ready now'
                logging.warning(f"[PARSER-DEBUG] Found timeline: Ready now (inferred)")
            elif re.search(r'first.*time|just.*started|beginning.*process', transcript, re.I):
                lead_data['timeline'] = 'Early stage'
                logging.warning(f"[PARSER-DEBUG] Found timeline: Early stage (inferred)")
            elif re.search(r'lease.*end|contract.*up|moving.*out', transcript, re.I):
                lead_data['timeline'] = 'When lease ends'
                logging.warning(f"[PARSER-DEBUG] Found timeline: When lease ends (inferred)")
        
        # Extract location - simple patterns
        location_match = re.search(r'in ([A-Za-z\s]+(?:County|Utah|City))', transcript, re.I)
        if location_match:
            lead_data['location'] = location_match.group(1).strip()
            logging.warning(f"[PARSER-DEBUG] Found location: {lead_data['location']}")
        
        # Enhanced budget extraction with comprehensive patterns
        budget_patterns = [
            r'\$([\d,]+(?:\.\d{2})?)(?:k|K|thousand|million|M)?',
            r'(up to|around|about|budget.*?)\s*\$([\d,]+)',
            r'(\d+)\s*k(?!\w)',  # Match "300k" but not "know"
            r'(\d+)\s*thousand',
            r'budget.*?(\$?[\d,]+)',
            r'price.*?range.*?(\$?[\d,]+)',
            r'looking.*?(\$?[\d,]+)',
            r'afford.*?(\$?[\d,]+)',
            r'spend.*?(\$?[\d,]+)',
            r'(\d{3,})(?:\s*dollars?)?',  # Match large numbers like "500000"
            r'(\d+)\s*(?:hundred|k|thousand|million)',
            r'between.*?(\$?[\d,]+).*?and.*?(\$?[\d,]+)',
            r'max.*?(\$?[\d,]+)',
            r'maximum.*?(\$?[\d,]+)',
            r'top.*?end.*?(\$?[\d,]+)',
            r'(\$?[\d,]+)\s*(?:range|budget|max|maximum)'
        ]
        
        budget_found = False
        for pattern in budget_patterns:
            budget_match = re.search(pattern, transcript, re.I)
            if budget_match:
                budget_text = budget_match.group().strip()
                
                # Clean up and format the budget
                if 'k' in budget_text.lower() and budget_text.replace('k', '').replace('K', '').replace('$', '').replace(',', '').strip().isdigit():
                    # Convert "300k" to "$300,000"
                    number = budget_text.replace('k', '').replace('K', '').replace('$', '').replace(',', '').strip()
                    lead_data['budget'] = f"${number}0,000"
                    budget_found = True
                    break
                elif 'thousand' in budget_text.lower():
                    # Extract number before "thousand"
                    num_match = re.search(r'(\d+)', budget_text)
                    if num_match:
                        lead_data['budget'] = f"${num_match.group(1)},000"
                        budget_found = True
                        break
                elif budget_text.replace('$', '').replace(',', '').isdigit():
                    # Format plain numbers
                    number = budget_text.replace('$', '').replace(',', '')
                    if len(number) >= 5:  # Assume it's a full amount like "500000"
                        formatted = f"${int(number):,}"
                        lead_data['budget'] = formatted
                        budget_found = True
                        break
                elif '$' in budget_text or budget_text.replace(',', '').isdigit():
                    # Keep as-is if it already has $ or is a plain number
                    if not budget_text.startswith('$') and budget_text.replace(',', '').isdigit():
                        lead_data['budget'] = f"${budget_text}"
                    else:
                        lead_data['budget'] = budget_text
                    budget_found = True
                    break
        
        # If no budget found, look for contextual clues
        if not budget_found:
            # Look for high-value context indicators
            if re.search(r'luxury|high.?end|premium|expensive', transcript, re.I):
                lead_data['budget'] = 'High-end'
                logging.warning(f"[PARSER-DEBUG] Found budget: High-end (inferred)")
            elif re.search(r'affordable|budget.?friendly|cheap|low.?cost', transcript, re.I):
                lead_data['budget'] = 'Budget-conscious'
                logging.warning(f"[PARSER-DEBUG] Found budget: Budget-conscious (inferred)")
            elif re.search(r'first.?time.?buyer|starter.?home', transcript, re.I):
                lead_data['budget'] = 'First-time buyer'
                logging.warning(f"[PARSER-DEBUG] Found budget: First-time buyer (inferred)")
        
        if budget_found:
            logging.warning(f"[PARSER-DEBUG] Found budget: {lead_data['budget']}")
        
        # Extract agent status
        if 'no not yet' in transcript.lower() or 'no agent' in transcript.lower():
            lead_data['hasAgent'] = 'No'
            logging.warning(f"[PARSER-DEBUG] Found agent status: No")
        
        # Extract financial status
        if 'cash buyer' in transcript.lower() or 'pay cash' in transcript.lower():
            lead_data['financialStatus'] = 'Cash buyer'
            logging.warning(f"[PARSER-DEBUG] Found financial status: Cash buyer")
        elif 'mortgage' in transcript.lower():
            lead_data['financialStatus'] = 'Has mortgage'
            logging.warning(f"[PARSER-DEBUG] Found financial status: Has mortgage")
        
        # Extract motivation
        if 'change' in transcript.lower() and 'scenery' in transcript.lower():
            lead_data['motivation'] = 'Change of scenery'
            logging.warning(f"[PARSER-DEBUG] Found motivation: Change of scenery")
        
        # Set next step based on conversation
        if 'consultation' in transcript.lower() or 'schedule' in transcript.lower():
            lead_data['nextStep'] = 'Consultation'
            logging.warning(f"[PARSER-DEBUG] Found next step: Consultation")
        
        logging.warning(f"[PARSER-DEBUG] Completed parsing, returning lead_data: {lead_data}")
        return lead_data
        
    except Exception as e:
        logging.error(f"[PARSER-DEBUG] Exception in fallback parser: {e}")
        import traceback
        logging.error(f"[PARSER-DEBUG] Traceback: {traceback.format_exc()}")
        return {}


# --- Lead Processing and Firestore Save Logic ---
def extract_and_save_lead_data(transcript: str, context_label: str = "unknown"):
    """Extract lead data from transcript and save to Firestore"""
    logging.warning(f"[DEBUG] Starting lead extraction ({context_label}) with transcript length: {len(transcript)}")
    
    # First try to find CRM.save block
    crm_regex = r"CRM\.save\((\{[\s\S]*?\})\)"
    match = re.search(crm_regex, transcript)
    
    if not match:
        logging.warning(f"[DEBUG] No CRM.save block found ({context_label}), using fallback parsing")
        # Use fallback parsing
        lead_data = parse_conversation_for_lead_data(transcript)
        
        # Check if we have minimum required data
        if not lead_data.get('phoneNumber'):
            logging.warning(f"[DEBUG] BLOCKING SAVE - No phone number available for lead data ({context_label}): {lead_data}")
            return False, {"success": False, "error": "No phone number found for lead."}
        
        logging.warning(f"Extracted lead data via fallback parsing ({context_label}): {lead_data}")
        source = "fallback_parsing"
    else:
        # Parse the CRM.save block
        try:
            crm_data_str = match.group(1)
            crm_data = eval(crm_data_str)  # This is safe since we control the input
            lead_data = crm_data
            logging.warning(f"Extracted lead data from CRM.save block ({context_label}): {lead_data}")
            source = "crm_save_block"
        except Exception as e:
            logging.error(f"Error parsing CRM.save block ({context_label}): {e}")
            return False, {"success": False, "error": f"Error parsing CRM.save block: {e}"}
    
    # Validate required fields
    logging.warning(f"[DEBUG] Final validation - lead_data: {lead_data}")
    if not lead_data.get('phoneNumber'):
        logging.warning(f"[DEBUG] FINAL VALIDATION FAILED - Missing phone number in lead data ({context_label}): {lead_data}")
        return False, {"success": False, "error": "Missing required field: phoneNumber."}
    
    # Prepare document for Firestore
    doc_data = {
        "phoneNumber": lead_data.get('phoneNumber'),
        "fullName": lead_data.get('fullName') or lead_data.get('fullname'),
        "status": lead_data.get('status'),
        "timeline": lead_data.get('timeline'),
        "location": lead_data.get('location'),
        "budget": lead_data.get('budget'),
        "financialStatus": lead_data.get('financialStatus'),
        "hasAgent": lead_data.get('hasAgent'),
        "motivation": lead_data.get('motivation'),
        "leadQuality": lead_data.get('leadQuality'),
        "nextStep": lead_data.get('nextStep'),
        "source": source,
        "extractedAt": datetime.utcnow().isoformat(),
        "rawTranscript": transcript[:2000]  # Limit transcript size
    }
    doc_data["createdAt"] = firestore.SERVER_TIMESTAMP
    
    logging.warning(f"Prepared Firestore document ({context_label}): {doc_data}")
    
    try:
        logging.warning(f"[DEBUG] About to save to Firestore ({context_label}): {doc_data}")
        doc_ref = db.collection("leads").document()
        doc_ref.set(doc_data)
        logging.warning(f"[DEBUG] SUCCESS - Saved lead to Firestore with ID ({context_label}): {doc_ref.id}")
        return True, {"success": True, "documentId": doc_ref.id, "source": doc_data["source"]}
    except Exception as e:
        logging.error(f"Unexpected error saving lead to Firestore ({context_label}): {e}")
        return False, {"success": False, "error": str(e)}


    # Check for SELLING intent
    selling_patterns = [
        r'list.*(?:property|house|home|condo)',
        r'sell.*(?:house|home|property|condo)',
        r'put.*(?:house|home|property).*(?:market|sale)',
        r'thinking.*(?:selling|sell)',
        r'ready.*sell',
        r'need.*sell',
        r'have.*(?:house|home|property).*sell',
        r'own.*(?:house|home|property).*sell',
        r'current.*(?:house|home|property).*sell',
        r'existing.*(?:house|home|property).*sell'
    ]
    
    # Check for RENTING intent
    renting_patterns = [
        r'looking to rent|want to rent|renting|interested in renting',
        r'rental|lease|leasing',
        r'rent.*(?:house|home|apartment|condo|place)',
        r'looking.*rental',
        r'need.*rent',
        r'apartment.*rent',
        r'monthly.*rent',
        r'lease.*(?:house|home|apartment)',
        r'tenant|renter'
    ]
    
    # Check for BUYING intent (most common, check last)
    buying_patterns = [
        r'looking to buy|want to buy|buying|interested in buying',
        r'purchase|purchasing',
        r'buy.*(?:house|home|property|condo)',
        r'looking.*(?:house|home|property|condo)',
        r'shopping.*(?:house|home|property)',
        r'house.*hunt|home.*hunt|property.*hunt',
        r'first.*time.*buyer',
        r'ready.*buy',
        r'need.*buy',
        r'thinking.*buying',
        r'market.*(?:house|home|property)',
        r'real.*estate.*(?:buy|purchase)',
        r'move.*(?:buy|purchase)',
        r'upgrade.*(?:house|home)',
        r'downsize.*(?:house|home)',
        r'relocat.*(?:buy|purchase)',
        r'new.*(?:house|home|property)',
        r'find.*(?:house|home|property)',
        r'search.*(?:house|home|property)'
    ]
    
    # Check patterns in order of specificity
    status_found = False
    
    # Check selling patterns first
    for pattern in selling_patterns:
        if re.search(pattern, transcript, re.I):
            lead_data['status'] = 'Seller'
            status_found = True
            break
    
    # Check renting patterns if not selling
    if not status_found:
        for pattern in renting_patterns:
            if re.search(pattern, transcript, re.I):
                lead_data['status'] = 'Renter'
                status_found = True
                break
    
    # Check buying patterns if not selling or renting
    if not status_found:
        for pattern in buying_patterns:
            if re.search(pattern, transcript, re.I):
                lead_data['status'] = 'Buyer'
                status_found = True
                break
    
    # If no specific intent found, try to infer from context
    if not status_found:
        # Look for contextual clues
        if re.search(r'mortgage|financing|loan|pre.*approved|down.*payment|closing', transcript, re.I):
            lead_data['status'] = 'Buyer'  # Financial terms usually indicate buying
        elif re.search(r'agent.*list|realtor.*list|commission|market.*value', transcript, re.I):
            lead_data['status'] = 'Seller'  # Listing terms indicate selling
        elif re.search(r'deposit|lease.*term|monthly|landlord', transcript, re.I):
            lead_data['status'] = 'Renter'  # Rental terms
    
    # Enhanced timeline extraction with comprehensive patterns
    timeline_patterns = [
        # Specific timeframes with numbers
        r'(within|in the|next|in)\s+(\w+\s+(?:months?|weeks?|years?))',
        r'(\d+)\s+(months?|weeks?|years?)',
        r'(\d+)\s*-\s*(\d+)\s+(months?|years?)',  # "3-6 months"
        
        # Common specific timeframes
        r'(six months|6 months|three months|3 months|one year|1 year|two years|2 years)',
        r'(immediately|ASAP|as soon as possible|right away|soon|quickly)',
        r'(couple.*months|few.*months|several.*months)',
        r'(couple.*years|few.*years)',
        
        # Seasonal and calendar references
        r'(next\s+(?:spring|summer|fall|winter|year))',
        r'(by\s+(?:spring|summer|fall|winter|\w+\s+\d{4}))',
        r'(this\s+(?:spring|summer|fall|winter|year|month))',
        r'(end\s+of\s+(?:year|\d{4}|spring|summer|fall|winter))',
        r'(beginning\s+of\s+(?:year|\d{4}|spring|summer|fall|winter))',
        r'(middle\s+of\s+(?:year|\d{4}|spring|summer|fall|winter))',
        
        # Relative timeframes
        r'(not\s+(?:rush|hurry|immediate))',
        r'(no\s+(?:rush|hurry|timeline))',
        r'(flexible\s+(?:timeline|timeframe))',
        r'(when\s+(?:ready|find|right))',
        r'(eventually|someday|future)',
        
        # Life event driven
        r'(when\s+(?:lease|contract)\s+(?:ends|expires|up))',
        r'(after\s+(?:graduation|retirement|job|work))',
        r'(before\s+(?:school|baby|wedding|move))',
        r'(once\s+(?:ready|find|sell))',
        
        # Market condition driven
        r'(when\s+(?:market|rates|prices)\s+(?:improve|drop|stabilize))',
        r'(if\s+(?:market|rates|prices)\s+(?:improve|drop|good))',
        
        # General urgency indicators
        r'(urgent|emergency|must\s+move)',
        r'(not\s+urgent|no\s+hurry)',
        r'(taking\s+(?:time|while))',
        r'(exploring\s+options)',
        r'(just\s+(?:looking|browsing|starting))',
        
        # Specific months/dates
        r'(january|february|march|april|may|june|july|august|september|october|november|december)\s*\d{0,4}',
        r'(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s*\d{0,4}',
        
        # Conditional timelines
        r'(depends\s+on\s+(?:[^.!?\n]+))',
        r'(waiting\s+(?:for|on|until)\s+(?:[^.!?\n]+))',
        r'(need\s+to\s+(?:sell|find|wait)\s+(?:[^.!?\n]+))'
    ]
    
    timeline_found = False
    for pattern in timeline_patterns:
        timeline_match = re.search(pattern, transcript, re.I)
        if timeline_match:
            timeline_text = timeline_match.group().strip()
            
            # Clean up and standardize timeline text
            if len(timeline_text) > 50:  # Limit very long matches
                timeline_text = timeline_text[:50] + "..."
            
            # Standardize common phrases
            timeline_lower = timeline_text.lower()
            if any(word in timeline_lower for word in ['asap', 'immediately', 'right away', 'soon']):
                lead_data['timeline'] = 'Immediately'
            elif any(word in timeline_lower for word in ['no rush', 'no hurry', 'flexible', 'eventually']):
                lead_data['timeline'] = 'Flexible timeline'
            elif any(word in timeline_lower for word in ['just looking', 'just browsing', 'exploring']):
                lead_data['timeline'] = 'Just browsing'
            elif 'couple' in timeline_lower and 'month' in timeline_lower:
                lead_data['timeline'] = 'Few months'
            elif 'few' in timeline_lower and 'month' in timeline_lower:
                lead_data['timeline'] = 'Few months'
            elif 'several' in timeline_lower and 'month' in timeline_lower:
                lead_data['timeline'] = 'Several months'
            else:
                lead_data['timeline'] = timeline_text
            
            timeline_found = True
            break
    
    # If no timeline found, look for contextual clues
    if not timeline_found:
        if re.search(r'pre.*approved|ready.*buy|cash.*buyer', transcript, re.I):
            lead_data['timeline'] = 'Ready now'
        elif re.search(r'first.*time|just.*started|beginning.*process', transcript, re.I):
            lead_data['timeline'] = 'Early stage'
        elif re.search(r'lease.*end|contract.*up|moving.*out', transcript, re.I):
            lead_data['timeline'] = 'When lease ends'
    
    # Enhanced budget extraction with comprehensive patterns and better processing
    budget_patterns = [
        r'\$([\d,]+(?:\.\d{2})?)(?:k|K|thousand|million|M)?',
        r'(up to|around|about|budget.*?)\s*\$([\d,]+)',
        r'(\d+)\s*k(?!\w)',  # Match "300k" but not "know"
        r'(\d+)\s*thousand',
        r'budget.*?(\$?[\d,]+)',
        r'price.*?range.*?(\$?[\d,]+)',
        r'looking.*?(\$?[\d,]+)',
        r'afford.*?(\$?[\d,]+)',
        r'spend.*?(\$?[\d,]+)',
        r'(\d{3,})(?:\s*dollars?)?',  # Match large numbers like "500000"
        r'(\d+)\s*(?:hundred|k|thousand|million)',
        r'between.*?(\$?[\d,]+).*?and.*?(\$?[\d,]+)',
        r'max.*?(\$?[\d,]+)',
        r'maximum.*?(\$?[\d,]+)',
        r'top.*?end.*?(\$?[\d,]+)',
        r'(\$?[\d,]+)\s*(?:range|budget|max|maximum)'
    ]
    
    budget_found = False
    for pattern in budget_patterns:
        budget_match = re.search(pattern, transcript, re.I)
        if budget_match:
            budget_text = budget_match.group().strip()
            
            # Clean up and format the budget
            if 'k' in budget_text.lower() and budget_text.replace('k', '').replace('K', '').replace('$', '').replace(',', '').strip().isdigit():
                # Convert "300k" to "$300,000"
                number = budget_text.replace('k', '').replace('K', '').replace('$', '').replace(',', '').strip()
                lead_data['budget'] = f"${number}0,000"
                break
            elif 'thousand' in budget_text.lower():
                # Extract number before "thousand"
                num_match = re.search(r'(\d+)', budget_text)
                if num_match:
                    lead_data['budget'] = f"${num_match.group(1)},000"
                    break
            elif budget_text.replace('$', '').replace(',', '').isdigit():
                # Format plain numbers
                number = budget_text.replace('$', '').replace(',', '')
                if len(number) >= 5:  # Assume it's a full amount like "500000"
                    formatted = f"${int(number):,}"
                    lead_data['budget'] = formatted
                    break
            elif '$' in budget_text or budget_text.replace(',', '').isdigit():
                # Keep as-is if it already has $ or is a plain number
                if not budget_text.startswith('$') and budget_text.replace(',', '').isdigit():
                    lead_data['budget'] = f"${budget_text}"
                else:
                    lead_data['budget'] = budget_text
                budget_found = True
                break
    
    # If no budget found, look for contextual clues
    if not budget_found:
        # Look for high-value context indicators
        if re.search(r'luxury|high.?end|premium|expensive', transcript, re.I):
            lead_data['budget'] = 'High-end'
        elif re.search(r'affordable|budget.?friendly|cheap|low.?cost', transcript, re.I):
            lead_data['budget'] = 'Budget-conscious'
        elif re.search(r'first.?time.?buyer|starter.?home', transcript, re.I):
            lead_data['budget'] = 'First-time buyer'

def format_budget_amount(budget_text):
    """Helper function to format budget amounts consistently"""
    if not budget_text:
        return None
    
    budget_lower = budget_text.lower().strip()
    
    # Handle "k" suffix (e.g., "300k" -> "$300,000")
    if budget_lower.endswith('k') and budget_lower[:-1].replace('.', '').replace(',', '').isdigit():
        number = budget_lower[:-1].replace(',', '')
        if '.' in number:
            # Handle "3.5k" -> "$3,500"
            return f"${float(number) * 1000:,.0f}"
        else:
            return f"${int(number) * 1000:,}"
    
    # Handle "thousand" suffix
    if 'thousand' in budget_lower:
        num_match = re.search(r'([\d,\.]+)', budget_text)
        if num_match:
            number = num_match.group(1).replace(',', '')
            if '.' in number:
                return f"${float(number) * 1000:,.0f}"
            else:
                return f"${int(number) * 1000:,}"
    
    # Handle "million" suffix
    if 'million' in budget_lower:
        num_match = re.search(r'([\d,\.]+)', budget_text)
        if num_match:
            number = num_match.group(1).replace(',', '')
            return f"${float(number) * 1000000:,.0f}"
    
    # Handle "hundred thousand" (e.g., "500 hundred thousand")
    if 'hundred thousand' in budget_lower:
        num_match = re.search(r'(\d+)', budget_text)
        if num_match:
            return f"${int(num_match.group(1)) * 100000:,}"
    
    # Handle "hundred" alone (assume thousands)
    if budget_lower.endswith('hundred') and not 'thousand' in budget_lower:
        num_match = re.search(r'(\d+)', budget_text)
        if num_match:
            return f"${int(num_match.group(1)) * 1000:,}"
    
    # Handle plain numbers (only if no suffix terms present)
    if not any(term in budget_lower for term in ['k', 'thousand', 'million', 'hundred']):
        # Extract just the number part while preserving dollar signs
        number_match = re.search(r'([\d,\.]+)', budget_text)
        if number_match:
            clean_number = number_match.group(1).replace(',', '')
            if clean_number.replace('.', '').isdigit():
                number = float(clean_number) if '.' in clean_number else int(clean_number)
                
                # Format based on number size
                if number >= 1000000:
                    return f"${number:,.0f}"
                elif number >= 100000:
                    return f"${number:,.0f}"
                elif number >= 10000:
                    return f"${number:,.0f}"
                elif number >= 1000:
                    # Assume it's already in proper format
                    return f"${number:,.0f}"
                else:
                    # Small numbers, assume they meant thousands
                    return f"${number * 1000:,.0f}"
    
    # Handle already formatted dollar amounts
    if budget_text.startswith('$'):
        return budget_text
    
    return None
    
    # Enhanced location extraction
    location_patterns = [
        r'(Utah County|Salt Lake County|Davis County|Weber County)',
        r'(Provo|Orem|Lehi|American Fork|Pleasant Grove|Springville|Spanish Fork|Payson)',
        r'(Salt Lake City|West Valley|Murray|Sandy|Draper|South Jordan|West Jordan)',
        r'(looking.*?in|interested.*?in|want.*?in|move.*?to)\s+([A-Z][a-z]+\s+[A-Z][a-z]+)',
        r'(areas?|cities|locations?).*?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)',
        r'(north|south|east|west)\s+(Utah|Salt Lake)',
        r'close to ([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)'
    ]
    for pattern in location_patterns:
        location_match = re.search(pattern, transcript, re.I)
        if location_match:
            location_text = location_match.group().strip()
            # Extract the actual location from the match
            if any(place in location_text for place in ['Utah', 'Salt Lake', 'Provo', 'Orem', 'Lehi']):
                lead_data['location'] = location_text
                break
    
    # Enhanced financial status extraction
    if re.search(r'pre.?approved|pre approved|already approved|have.*approval|got.*approval', transcript, re.I):
        lead_data['financialStatus'] = 'Pre-approved'
    elif re.search(r'cash buyer|paying cash|cash purchase|all cash|cash offer', transcript, re.I):
        lead_data['financialStatus'] = 'Cash buyer'
    elif re.search(r'need.*mortgage|get.*mortgage|not.*pre.?approved|need.*approval|working.*lender', transcript, re.I):
        lead_data['financialStatus'] = 'Not yet'
    elif re.search(r'financing|loan|mortgage.*ready|qualified', transcript, re.I):
        lead_data['financialStatus'] = 'In process'
    
    # Enhanced agent status extraction
    if re.search(r'not.*working.*agent|no.*agent|don\'t have.*agent|without.*agent|need.*agent', transcript, re.I):
        lead_data['hasAgent'] = 'No'
    elif re.search(r'working.*agent|have.*agent|with.*agent|my.*agent|current.*agent', transcript, re.I):
        lead_data['hasAgent'] = 'Yes'
    
    # Enhanced motivation extraction
    motivation_patterns = [
        r'(want to be|need to be|be closer to)\s+([^.!?\n]+)',
        r'(driving.*decision|reason.*moving|why.*move).*?([^.!?\n]+)',
        r'(because|since)\s+([^.!?\n]+)',
        r'(family|job|work|career|retirement|kids|grandkids|school).*?([^.!?\n]+)',
        r'(relocating|moving).*?(for|because)\s+([^.!?\n]+)',
        r'(downsizing|upsizing|upgrading).*?([^.!?\n]+)'
    ]
    for pattern in motivation_patterns:
        motivation_match = re.search(pattern, transcript, re.I)
        if motivation_match:
            motivation_text = motivation_match.group().strip()
            # Clean up motivation text
            if len(motivation_text) > 10:  # Only use substantial motivations
                lead_data['motivation'] = motivation_text[:100]  # Limit length
                break
    
    # Enhanced lead quality scoring
    quality_score = 0
    
    # Financial readiness (+2 for pre-approved/cash, +1 for in process)
    if lead_data.get('financialStatus') in ['Pre-approved', 'Cash buyer']:
        quality_score += 2
    elif lead_data.get('financialStatus') == 'In process':
        quality_score += 1
    
    # Agent status (+1 for no agent)
    if lead_data.get('hasAgent') == 'No':
        quality_score += 1
    
    # Timeline urgency (+2 for immediate/months, +1 for this year)
    timeline = lead_data.get('timeline', '').lower()
    if any(word in timeline for word in ['immediate', 'asap', 'month']):
        quality_score += 2
    elif any(word in timeline for word in ['year', 'spring', 'summer', 'fall', 'winter']):
        quality_score += 1
    
    # Budget specified (+1)
    if lead_data.get('budget'):
        quality_score += 1
    
    # Assign quality based on score
    if quality_score >= 4:
        lead_data['leadQuality'] = 'High'
    elif quality_score >= 2:
        lead_data['leadQuality'] = 'Medium'
    else:
        lead_data['leadQuality'] = 'Low'
    
    # Enhanced next step determination
    if re.search(r'send.*information|send.*resources|email.*info|text.*info|mail.*info', transcript, re.I):
        lead_data['nextStep'] = 'Send info'
    elif re.search(r'consultation|meeting|appointment|schedule|call.*back|follow.*up', transcript, re.I):
        lead_data['nextStep'] = 'Schedule consultation'
    elif re.search(r'show.*properties|view.*homes|see.*listings|tour', transcript, re.I):
        lead_data['nextStep'] = 'Property showing'
    elif re.search(r'not.*interested|not.*ready|call.*later|maybe.*later', transcript, re.I):
        lead_data['nextStep'] = 'No action'
    else:
        lead_data['nextStep'] = 'Follow up'
    
    logging.warning(f"[PARSER-DEBUG] Completed parsing, returning lead_data: {lead_data}")
    logging.warning(f"[PARSER-DEBUG] Lead data keys: {list(lead_data.keys())}")
    return lead_data

def parse_conversation_for_lead_data(transcript: str):
    """Enhanced conversation parser to extract lead data from natural conversation"""
    try:
        logging.warning(f"[PARSER-DEBUG] Starting conversation parsing, transcript length: {len(transcript)}")
        logging.warning(f"[PARSER-DEBUG] First 500 chars: {transcript[:500]}")
        
        # Initialize lead data dictionary
        lead_data = {}
        
        # Fixed name extraction - focus on user introductions only
        name_patterns = [
            # "Yes, this is [Name]" - most common pattern
            r'user:.*?(?:yes,?\s+)?this is ([A-Z][a-z]+)(?:\.|\s|$)',
            # "My name is [Name]"
            r'user:.*?my name is ([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)',
            # "I'm [Name]" but not "I'm looking" etc
            r'user:.*?I\'m ([A-Z][a-z]+)(?:\s+[A-Z][a-z]+)?(?:\.|\s|$)',
            # Single name responses to "Am I speaking with [Name]?"
            r'user:.*?(?:yes|yeah),?\s+(?:this is\s+)?([A-Z][a-z]+)(?:\.|\s|$)',
        ]
        
        for pattern in name_patterns:
            name_matches = re.findall(pattern, transcript, re.I)
            for potential_name in name_matches:
                name = potential_name.strip()
                # Filter out common false positives and agent name
                if (name.lower() not in ['alexis', 'agent', 'calling', 'speaking', 'here', 'looking', 'selling', 'buying', 'hoping', 'thinking'] 
                    and not name.lower().endswith('ing')):  # Avoid gerunds
                    lead_data['fullName'] = name
                    logging.warning(f"[PARSER-DEBUG] Found name: {name}")
                    break
            if 'fullName' in lead_data:
                break
        
        # Improved phone number extraction - look for user providing their number
        phone_patterns = [
            # User giving their phone number
            r'user:.*?(?:phone|number|call me|reach me|contact me).*?([\d\-\(\)\s\.]{10,})',
            r'user:.*?(?:my number is|number is|it\'s)\s*([\d\-\(\)\s\.]{10,})',
            # Standard phone formats anywhere in user messages
            r'user:.*?(\(?\d{3}\)?[\s\-\.]?\d{3}[\s\-\.]?\d{4})',
            r'user:.*?(\d{3}[\s\-\.]\d{3}[\s\-\.]\d{4})',
            # Fallback: any phone-like pattern from user
            r'user:.*?(\d{3}[-\s]?\d{3}[-\s]?\d{4})',
        ]
        
        for pattern in phone_patterns:
            phone_matches = re.findall(pattern, transcript)
            for phone_text in phone_matches:
                # Clean up phone number
                clean_phone = re.sub(r'[^\d]', '', phone_text)
                if len(clean_phone) == 10:
                    lead_data['phoneNumber'] = f"+1{clean_phone}"
                    logging.warning(f"[PARSER-DEBUG] Found phone: +1{clean_phone}")
                    break
                elif len(clean_phone) == 11 and clean_phone.startswith('1'):
                    lead_data['phoneNumber'] = f"+{clean_phone}"
                    logging.warning(f"[PARSER-DEBUG] Found phone: +{clean_phone}")
                    break
            if 'phoneNumber' in lead_data:
                break
        
        # Fixed timeline extraction - handle specific timeline responses
        timeline_patterns = [
            (r'user:.*?(?:immediately|right away|asap|as soon as possible|urgent)', 'Immediately'),
            # Handle "In the next six months" pattern specifically
            (r'user:.*?(?:in\s+the\s+next\s+(?:six|6)\s+months?)', 'Next six months'),
            (r'user:.*?(?:within.*?(?:next|the)\s+(?:six|6)\s+months?)', 'Next six months'),
            (r'user:.*?(?:next.*month|within.*month|this month|30 days)', 'Next month'),
            (r'user:.*?(?:few months|3.*months|three months|2-3 months)', 'Next few months'),
            (r'user:.*?(?:spring|summer|fall|winter)', 'Seasonal'),
            (r'user:.*?(?:this year|2025)', 'This year'),
            (r'user:.*?(?:next year|2026|long term|eventually)', 'Next year'),
            (r'user:.*?(?:just looking|browsing|not sure|maybe|exploring)', 'Just looking'),
        ]
        
        for pattern, timeline_value in timeline_patterns:
            if re.search(pattern, transcript, re.I):
                lead_data['timeline'] = timeline_value
                logging.warning(f"[PARSER-DEBUG] Found timeline: {timeline_value}")
                break
        
        # Fixed budget extraction - handle decimal millions properly
        budget_patterns = [
            # User mentioning decimal millions (e.g., "1.75 million")
            r'user:.*?([\d,]*\.?\d+)\s*million\b',
            # User mentioning whole millions
            r'user:.*?([\d,]+)\s*million\b', 
            # User mentioning thousands with decimal
            r'user:.*?([\d,]*\.?\d+)\s*(?:thousand|k)\b',
            # User mentioning budget with dollar signs
            r'user:.*?budget.*?\$([\d,]+(?:\.\d{2})?)',
            r'user:.*?\$([\d,]+(?:\.\d{2})?).*?budget',
            # User mentioning price range with dollar sign (don't multiply)
            r'user:.*?(?:up to|around|about|maximum|thinking|hoping|get)\s*\$([\d,]+(?:\.\d{2})?)',
            # User mentioning range
            r'user:.*?(\d+)\s*to\s*(\d+).*?(?:thousand|k)',
            # Simple number patterns from user
            r'user:.*?\$([\d,]+)',
        ]
        
        for pattern in budget_patterns:
            budget_match = re.search(pattern, transcript, re.I)
            if budget_match:
                budget_text = budget_match.group(1)
                full_match = budget_match.group(0).lower()
                try:
                    # Remove commas and convert to number
                    number = float(budget_text.replace(',', ''))
                    
                    # Handle thousands/millions based on the full match context
                    if 'million' in full_match:
                        number *= 1000000
                        logging.warning(f"[PARSER-DEBUG] Found budget: {budget_text} million = ${number:,.0f}")
                    elif 'thousand' in full_match or ('k' in full_match and '$' not in full_match):
                        number *= 1000
                        logging.warning(f"[PARSER-DEBUG] Found budget: {budget_text} thousand = ${number:,.0f}")
                    elif '$' in full_match:
                        # Dollar amount already specified, don't multiply
                        logging.warning(f"[PARSER-DEBUG] Found budget: ${number:,.0f} (dollar amount)")
                    else:
                        # Assume it's already in dollars if no unit specified
                        logging.warning(f"[PARSER-DEBUG] Found budget: ${number:,.0f}")
                    
                    # Format the final amount
                    lead_data['budget'] = f"${number:,.0f}"
                    break
                except ValueError:
                    logging.warning(f"[PARSER-DEBUG] Failed to parse budget: {budget_text}")
                    continue
        
        # Fixed location extraction - focus on user location responses
        location_patterns = [
            # User mentioning specific Utah counties
            r'user:.*?(Utah County|Salt Lake County|Davis County|Weber County)',
            # User mentioning specific Utah cities
            r'user:.*?(Provo|Orem|Lehi|American Fork|Pleasant Grove|Springville|Spanish Fork|Payson|Alpine|Park City|Draper|Sandy|Murray)',
            r'user:.*?(Salt Lake City|West Valley|South Jordan|West Jordan)',
            # User saying "It's in [Location]" or "Located in [Location]"
            r'user:.*?(?:it\'s in|located in|in)\s+([A-Z][a-z]+(?:,?\s+Utah)?)',
            # User mentioning Utah areas
            r'user:.*?([A-Z][a-z]+),?\s+Utah\b',
            # General location patterns from user
            r'user:.*?(?:looking.*?in|interested.*?in|want.*?in|move.*?to)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)',
        ]
        
        for pattern in location_patterns:
            location_match = re.search(pattern, transcript, re.I)
            if location_match:
                location_text = location_match.group(1).strip()
                # Clean up location text and validate
                if location_text.lower() not in ['mind for', 'upgrade agent', 'looking', 'selling', 'buying']:
                    # Add Utah if it's a known Utah city without state
                    utah_cities = ['alpine', 'provo', 'orem', 'lehi', 'draper', 'sandy', 'murray', 'park city']
                    if location_text.lower() in utah_cities and 'utah' not in location_text.lower():
                        location_text = f"{location_text}, Utah"
                    lead_data['location'] = location_text
                    logging.warning(f"[PARSER-DEBUG] Found location: {location_text}")
                    break
        
        # Improved financial status extraction - look for user responses
        financial_patterns = [
            (r'user:.*?(?:pre.?approved|pre approved|already approved|have.*approval|got.*approval)', 'Pre-approved'),
            (r'user:.*?(?:cash buyer|paying cash|cash purchase|all cash|cash offer)', 'Cash buyer'),
            (r'user:.*?(?:need.*mortgage|get.*mortgage|not.*pre.?approved|need.*approval|working.*lender)', 'Not yet'),
            (r'user:.*?(?:financing|loan|mortgage.*ready|qualified)', 'In process'),
        ]
        
        for pattern, status_value in financial_patterns:
            if re.search(pattern, transcript, re.I):
                lead_data['financialStatus'] = status_value
                logging.warning(f"[PARSER-DEBUG] Found financial status: {status_value}")
                break
        
        # Status extraction - identify if user is looking to buy, sell, or rent
        status_found = False
        
        # Check for BUYING intent first (most common)
        buying_patterns = [
            r'user:.*?(?:looking to buy|want to buy|buying|interested in buying)',
            r'user:.*?(?:purchase|purchasing)',
            r'user:.*?(?:buy.*(?:house|home|property|condo))',
            r'user:.*?(?:looking.*(?:house|home|property|condo))',
            r'user:.*?(?:shopping.*(?:house|home|property))',
            r'user:.*?(?:house.*hunt|home.*hunt|property.*hunt)',
            r'user:.*?(?:first.*time.*buyer)',
            r'user:.*?(?:ready.*buy|need.*buy|thinking.*buying)',
            r'user:.*?(?:market.*(?:house|home|property))',
            r'user:.*?(?:real.*estate.*(?:buy|purchase))',
            r'user:.*?(?:move.*(?:buy|purchase))',
            r'user:.*?(?:upgrade.*(?:house|home)|downsize.*(?:house|home))',
            r'user:.*?(?:relocat.*(?:buy|purchase))',
            r'user:.*?(?:new.*(?:house|home|property))',
            r'user:.*?(?:find.*(?:house|home|property))',
            r'user:.*?(?:search.*(?:house|home|property))',
        ]
        
        for pattern in buying_patterns:
            if re.search(pattern, transcript, re.I):
                lead_data['status'] = 'Buyer'
                logging.warning(f"[PARSER-DEBUG] Found status: Buyer")
                status_found = True
                break
        
        # Check for SELLING intent if not buying (more specific patterns)
        if not status_found:
            selling_patterns = [
                r'user:.*?(?:looking to sell|want to sell|selling|interested in selling)',
                r'user:.*?(?:list.*(?:property|house|home|condo))',
                r'user:.*?(?:sell.*(?:house|home|property|condo))',
                r'user:.*?(?:put.*(?:house|home|property).*(?:market|sale))',
                r'user:.*?(?:thinking.*(?:selling|sell))',
                r'user:.*?(?:ready.*sell|need.*sell)',
                r'user:.*?(?:have.*(?:house|home|property).*sell)',
                r'user:.*?(?:current.*(?:house|home|property).*sell)',
            ]
            
            for pattern in selling_patterns:
                if re.search(pattern, transcript, re.I):
                    lead_data['status'] = 'Seller'
                    logging.warning(f"[PARSER-DEBUG] Found status: Seller")
                    status_found = True
                    break
        
        # Check for RENTING intent if not selling
        if not status_found:
            renting_patterns = [
                r'user:.*?(?:looking to rent|want to rent|renting|interested in renting)',
                r'user:.*?(?:rental|lease|leasing)',
                r'user:.*?(?:rent.*(?:house|home|apartment|condo|place))',
                r'user:.*?(?:looking.*rental|need.*rent)',
                r'user:.*?(?:apartment.*rent|monthly.*rent)',
                r'user:.*?(?:lease.*(?:house|home|apartment))',
                r'user:.*?(?:tenant|renter)',
            ]
            
            for pattern in renting_patterns:
                if re.search(pattern, transcript, re.I):
                    lead_data['status'] = 'Renter'
                    logging.warning(f"[PARSER-DEBUG] Found status: Renter")
                    status_found = True
                    break
        
        # Check for BUYING intent if not selling or renting (most common, check last)
        if not status_found:
            buying_patterns = [
                r'user:.*?(?:looking to buy|want to buy|buying|interested in buying)',
                r'user:.*?(?:purchase|purchasing)',
                r'user:.*?(?:buy.*(?:house|home|property|condo))',
                r'user:.*?(?:looking.*(?:house|home|property|condo))',
                r'user:.*?(?:shopping.*(?:house|home|property))',
                r'user:.*?(?:house.*hunt|home.*hunt|property.*hunt)',
                r'user:.*?(?:first.*time.*buyer)',
                r'user:.*?(?:ready.*buy|need.*buy|thinking.*buying)',
                r'user:.*?(?:market.*(?:house|home|property))',
                r'user:.*?(?:real.*estate.*(?:buy|purchase))',
                r'user:.*?(?:move.*(?:buy|purchase))',
                r'user:.*?(?:upgrade.*(?:house|home)|downsize.*(?:house|home))',
                r'user:.*?(?:relocat.*(?:buy|purchase))',
                r'user:.*?(?:new.*(?:house|home|property))',
                r'user:.*?(?:find.*(?:house|home|property))',
                r'user:.*?(?:search.*(?:house|home|property))',
            ]
            
            for pattern in buying_patterns:
                if re.search(pattern, transcript, re.I):
                    lead_data['status'] = 'Buyer'
                    logging.warning(f"[PARSER-DEBUG] Found status: Buyer")
                    status_found = True
                    break
        
        # If no specific status found, default to Unknown
        if not status_found:
            lead_data['status'] = 'Unknown'
            logging.warning(f"[PARSER-DEBUG] No status patterns matched, defaulting to: Unknown")
        
        # Improved agent status extraction - look for user responses
        agent_patterns = [
            (r'user:.*?(?:not.*working.*agent|no.*agent|don\'t have.*agent|without.*agent|need.*agent)', 'No'),
            (r'user:.*?(?:working.*agent|have.*agent|with.*agent|my.*agent|current.*agent)', 'Yes'),
        ]
        
        for pattern, agent_value in agent_patterns:
            if re.search(pattern, transcript, re.I):
                lead_data['hasAgent'] = agent_value
                logging.warning(f"[PARSER-DEBUG] Found agent status: {agent_value}")
                break
        
        # Enhanced motivation extraction
        motivation_patterns = [
            r'(want to be|need to be|be closer to)\s+([^.!?\n]+)',
            r'(driving.*decision|reason.*moving|why.*move).*?([^.!?\n]+)',
            r'(because|since)\s+([^.!?\n]+)',
            r'(family|job|work|career|retirement|kids|grandkids|school).*?([^.!?\n]+)',
            r'(relocating|moving).*?(for|because)\s+([^.!?\n]+)',
            r'(downsizing|upsizing|upgrading).*?([^.!?\n]+)',
        ]
        for pattern in motivation_patterns:
            motivation_match = re.search(pattern, transcript, re.I)
            if motivation_match:
                motivation_text = motivation_match.group().strip()
                # Clean up motivation text
                if len(motivation_text) > 10:  # Only use substantial motivations
                    lead_data['motivation'] = motivation_text[:100]  # Limit length
                    break
        
        # Enhanced lead quality scoring
        quality_score = 0
        
        # Financial readiness (+2 for pre-approved/cash, +1 for in process)
        if lead_data.get('financialStatus') in ['Pre-approved', 'Cash buyer']:
            quality_score += 2
        elif lead_data.get('financialStatus') == 'In process':
            quality_score += 1
        
        # Agent status (+1 for no agent)
        if lead_data.get('hasAgent') == 'No':
            quality_score += 1
        
        # Timeline urgency (+2 for immediate/months, +1 for this year)
        timeline = lead_data.get('timeline', '').lower()
        if any(word in timeline for word in ['immediate', 'asap', 'month']):
            quality_score += 2
        elif any(word in timeline for word in ['year', 'spring', 'summer', 'fall', 'winter']):
            quality_score += 1
        
        # Budget specified (+1)
        if lead_data.get('budget'):
            quality_score += 1
        
        # Assign quality based on score
        if quality_score >= 4:
            lead_data['leadQuality'] = 'High'
        elif quality_score >= 2:
            lead_data['leadQuality'] = 'Medium'
        else:
            lead_data['leadQuality'] = 'Low'
        
        # Enhanced next step determination
        if re.search(r'send.*information|send.*resources|email.*info|text.*info|mail.*info', transcript, re.I):
            lead_data['nextStep'] = 'Send info'
        elif re.search(r'consultation|meeting|appointment|schedule|call.*back|follow.*up', transcript, re.I):
            lead_data['nextStep'] = 'Schedule consultation'
        elif re.search(r'show.*properties|view.*homes|see.*listings|tour', transcript, re.I):
            lead_data['nextStep'] = 'Property showing'
        elif re.search(r'not.*interested|not.*ready|call.*later|maybe.*later', transcript, re.I):
            lead_data['nextStep'] = 'No action'
        else:
            lead_data['nextStep'] = 'Follow up'
        
        logging.warning(f"[PARSER-DEBUG] Completed parsing, returning lead_data: {lead_data}")
        logging.warning(f"[PARSER-DEBUG] Lead data keys: {list(lead_data.keys())}")
        return lead_data
        
    except Exception as e:
        logging.error(f"[PARSER-DEBUG] Exception in conversation parser: {e}")
        import traceback
        logging.error(f"[PARSER-DEBUG] Traceback: {traceback.format_exc()}")
        return {}

def extract_and_save_lead_with_phone(transcript: str, phone_number: str = None, context_label: str = "receive-transcript"):
    """Extract and save lead data with optional phone number from webhook"""
    logging.warning(f"[DEBUG] Starting extract_and_save_lead_with_phone ({context_label})")
    logging.warning(f"[DEBUG] Phone number provided: {phone_number}")
    logging.warning(f"[DEBUG] Transcript length: {len(transcript)} chars")
    
    # Extract CRM.save({...}) block
    crm_regex = r"CRM\.save\((\{[\s\S]*?\})\)"
    match = re.search(crm_regex, transcript)
    if not match:
        logging.warning(f"CRM.save block not found in transcript ({context_label}): {transcript[:500]}...")
        # Fallback: Parse conversation for lead data
        logging.warning(f"[DEBUG] Attempting fallback conversation parsing ({context_label})")
        try:
            lead_data = parse_conversation_for_lead_data(transcript)
            if lead_data is None:
                logging.error(f"[DEBUG] Fallback parser returned None! Creating empty dict ({context_label})")
                lead_data = {}
            logging.warning(f"[DEBUG] Fallback parsing result ({context_label}): {lead_data}")
        except Exception as e:
            logging.error(f"[DEBUG] Exception in fallback parser ({context_label}): {e}")
            lead_data = {}
        
        # Use phone number from webhook if available
        logging.warning(f"[DEBUG] Before phone injection - lead_data: {lead_data}")
        if phone_number and not lead_data.get('phoneNumber'):
            lead_data['phoneNumber'] = phone_number
            logging.warning(f"[DEBUG] Added phone number from webhook ({context_label}): {phone_number}")
        elif phone_number:
            logging.warning(f"[DEBUG] Phone number already exists in lead_data, webhook phone: {phone_number}, existing: {lead_data.get('phoneNumber')}")
        
        logging.warning(f"[DEBUG] After phone injection - lead_data: {lead_data}")
        
        # Check if we have at least a phone number to save
        if not lead_data.get('phoneNumber'):
            logging.warning(f"[DEBUG] BLOCKING SAVE - No phone number available for lead data ({context_label}): {lead_data}")
            return False, {"success": False, "error": "No phone number found for lead."}
        
        logging.warning(f"Extracted lead data via fallback parsing ({context_label}): {lead_data}")
        source = "fallback_parsing"
    else:
        # Parse the CRM.save block
        try:
            crm_data_str = match.group(1)
            crm_data = eval(crm_data_str)  # This is safe since we control the input
            lead_data = crm_data
            logging.warning(f"Extracted lead data from CRM.save block ({context_label}): {lead_data}")
            source = "crm_save_block"
        except Exception as e:
            logging.error(f"Error parsing CRM.save block ({context_label}): {e}")
            return False, {"success": False, "error": f"Error parsing CRM.save block: {e}"}
    
    # Validate required fields
    logging.warning(f"[DEBUG] Final validation - lead_data: {lead_data}")
    if not lead_data.get('phoneNumber'):
        logging.warning(f"[DEBUG] FINAL VALIDATION FAILED - Missing phone number in lead data ({context_label}): {lead_data}")
        return False, {"success": False, "error": "Missing required field: phoneNumber."}
    
    # Prepare document for Firestore
    doc_data = {
        "phoneNumber": lead_data.get('phoneNumber'),
        "fullName": lead_data.get('fullName') or lead_data.get('fullname'),
        "status": lead_data.get('status'),
        "timeline": lead_data.get('timeline'),
        "location": lead_data.get('location'),
        "budget": lead_data.get('budget'),
        "financialStatus": lead_data.get('financialStatus'),
        "hasAgent": lead_data.get('hasAgent'),
        "motivation": lead_data.get('motivation'),
        "leadQuality": lead_data.get('leadQuality'),
        "nextStep": lead_data.get('nextStep'),
        "source": source,
        "extractedAt": datetime.utcnow().isoformat(),
        "rawTranscript": transcript[:2000]  # Limit transcript size
    }
    doc_data["createdAt"] = firestore.SERVER_TIMESTAMP
    
    logging.warning(f"Prepared Firestore document ({context_label}): {doc_data}")
    
    try:
        logging.warning(f"[DEBUG] About to save to Firestore ({context_label}): {doc_data}")
        doc_ref = db.collection("leads").document()
        doc_ref.set(doc_data)
        logging.warning(f"[DEBUG] SUCCESS - Saved lead to Firestore with ID ({context_label}): {doc_ref.id}")
        return True, {"success": True, "documentId": doc_ref.id, "source": doc_data["source"]}
    except Exception as e:
        logging.error(f"Unexpected error saving lead to Firestore ({context_label}): {e}")
        return False, {"success": False, "error": str(e)}



@app.post("/api/process-agent-output")
async def process_agent_output(request: Request):
    try:
        data = await request.json()
        transcript = data.get("transcript")
        if not transcript or not isinstance(transcript, str):
            logging.warning("Missing or invalid transcript in /api/process-agent-output")
            return JSONResponse(status_code=400, content={"success": False, "error": "Missing or invalid transcript."})
        ok, resp = extract_and_save_lead_with_phone(transcript, context_label="process-agent-output")
        return JSONResponse(status_code=200 if ok else 400, content=resp)
    except Exception as e:
        logging.error(f"Unexpected error in /api/process-agent-output: {e}")
        return JSONResponse(status_code=500, content={"success": False, "error": str(e)})

# --- New endpoint for transcript webhook ---
@app.post("/api/receive-transcript")
async def receive_transcript(request: Request):
    try:
        data = await request.json()
        transcript = data.get("transcript")
        if not transcript or not isinstance(transcript, str):
            logging.warning("Missing or invalid transcript in /api/receive-transcript")
            return JSONResponse(status_code=400, content={"success": False, "error": "Missing or invalid transcript."})
        ok, resp = extract_and_save_lead_with_phone(transcript, context_label="receive-transcript")
        return JSONResponse(status_code=200 if ok else 400, content=resp)
    except Exception as e:
        logging.error(f"Unexpected error in /api/receive-transcript: {e}")
        return JSONResponse(status_code=500, content={"success": False, "error": str(e)})

# --- Webhook for ElevenLabs final transcript ---
@app.post("/webhook/elevenlabs-final")
async def elevenlabs_final_webhook(
    request: Request,
    elevenlabs_signature: str = Header(None, alias="elevenlabs-signature")
):
    # DEBUG: Log all incoming headers
    headers_dict = dict(request.headers)
    logging.warning(f"[webhook/elevenlabs-final] Incoming headers: {headers_dict}")
    logging.warning(f"[webhook/elevenlabs-final] elevenlabs-signature header value: {elevenlabs_signature}")
    
    import hmac
    import hashlib
    
    secret = os.getenv("ELEVENLABS_WEBHOOK_SECRET")
    if not secret:
        logging.error("ELEVENLABS_WEBHOOK_SECRET not set in environment!")
        raise HTTPException(status_code=500, detail="Webhook secret not configured")
    
    if not elevenlabs_signature:
        logging.warning("Missing elevenlabs-signature header")
        raise HTTPException(status_code=401, detail="Missing signature header")
    
    try:
        # Parse the header: t=timestamp,v0=hash
        parts = dict(item.split("=", 1) for item in elevenlabs_signature.split(",") if "=" in item)
        logging.warning(f"[webhook/elevenlabs-final] Parsed signature parts: {parts}")
        
        timestamp = parts.get("t")
        signature = parts.get("v0")
        
        if not timestamp or not signature:
            logging.warning(f"Malformed elevenlabs-signature header: parsed parts={parts}, raw header={elevenlabs_signature}")
            raise HTTPException(status_code=401, detail="Malformed signature header")
        
        # Get request body for signature verification
        body = await request.body()
        
        # Validate signature according to ElevenLabs documentation
        full_payload_to_sign = f"{timestamp}.{body.decode('utf-8')}"
        expected_signature = "v0=" + hmac.new(
            key=secret.encode("utf-8"),
            msg=full_payload_to_sign.encode("utf-8"),
            digestmod=hashlib.sha256
        ).hexdigest()
        
        logging.warning(f"[webhook/elevenlabs-final] Provided signature: {signature}")
        logging.warning(f"[webhook/elevenlabs-final] Expected signature: {expected_signature}")
        
        if not hmac.compare_digest(expected_signature, "v0=" + signature):
            logging.warning("Invalid ElevenLabs webhook signature")
            raise HTTPException(status_code=401, detail="Invalid webhook signature")
        
        # Parse JSON payload
        try:
            webhook_data = await request.json()
            logging.warning(f"[webhook/elevenlabs-final] Received webhook data: {webhook_data}")
        except Exception as e:
            logging.error(f"[webhook/elevenlabs-final] Error parsing JSON body: {e}")
            logging.error(f"[webhook/elevenlabs-final] Raw body: {body[:1000]}")
            return JSONResponse(status_code=400, content={"success": False, "error": "Invalid JSON body"})
        
        # Check webhook type - we only handle post_call_transcription
        webhook_type = webhook_data.get("type")
        if webhook_type != "post_call_transcription":
            logging.warning(f"[webhook/elevenlabs-final] Ignoring webhook type: {webhook_type}")
            return JSONResponse(status_code=200, content={"success": True, "message": f"Ignored webhook type: {webhook_type}"})
        
        # Extract data from the correct structure
        data = webhook_data.get("data", {})
        transcript_list = data.get("transcript", [])
        
        if not transcript_list or not isinstance(transcript_list, list):
            logging.warning("Missing or invalid transcript list in post_call_transcription webhook")
            return JSONResponse(status_code=400, content={"success": False, "error": "Missing or invalid transcript list."})
        
        # Extract conversation metadata
        conversation_id = data.get("conversation_id", "unknown")
        agent_id = data.get("agent_id", "unknown")
        logging.warning(f"[webhook/elevenlabs-final] Processing conversation {conversation_id} from agent {agent_id}")
        
        # Extract phone number from ElevenLabs webhook data
        phone_number = None
        conversation_init_data = webhook_data.get("data", {}).get("conversation_initiation_client_data", {})
        dynamic_vars = conversation_init_data.get("dynamic_variables", {})
        phone_number = dynamic_vars.get("system__caller_id")
        
        if phone_number:
            logging.warning(f"[webhook/elevenlabs-final] Extracted phone number from webhook: {phone_number}")
        
        # Join all messages into a single string for lead extraction
        transcript_text = "\n".join(
            f"{msg.get('role', 'unknown')}: {msg.get('message', '')}" 
            for msg in transcript_list if isinstance(msg, dict) and msg.get('message')
        )
        logging.warning(f"[webhook/elevenlabs-final] Flattened transcript ({len(transcript_text)} chars): {transcript_text[:1000]}...")
        
        # Extract and save lead data with phone number from webhook
        ok, resp = extract_and_save_lead_with_phone(transcript_text, phone_number, context_label="elevenlabs-final-webhook")
        
        if ok:
            logging.warning(f"[webhook/elevenlabs-final] Successfully processed conversation {conversation_id}")
            
            # Notify frontend via SSE that call has ended
            call_notification = {
                "conversation_id": conversation_id,
                "agent_id": agent_id,
                "phone_number": phone_number,
                "document_id": resp.get("documentId"),
                "lead_data": resp.get("lead_data", {}),
                "timestamp": datetime.utcnow().isoformat()
            }
            await notify_call_ended(call_notification)
            
        else:
            logging.warning(f"[webhook/elevenlabs-final] Failed to extract lead from conversation {conversation_id}: {resp}")
        
        return JSONResponse(status_code=200 if ok else 400, content=resp)
        
    except Exception as e:
        logging.error(f"Unexpected error in /webhook/elevenlabs-final: {e}")
        return JSONResponse(status_code=500, content={"success": False, "error": str(e)})

@app.post("/api/save-lead-from-agent")
async def save_lead_from_agent(request: Request):
    try:
        data = await request.json()
        transcript = data.get("transcript")
        if not transcript or not isinstance(transcript, str):
            raise HTTPException(status_code=400, detail="Missing or invalid transcript.")
        ok, resp = extract_and_save_lead_data(transcript, context_label="save-lead-from-agent")
        if ok:
            return JSONResponse(status_code=200, content=resp)
        else:
            return JSONResponse(status_code=400, content=resp)
    except HTTPException as e:
        return JSONResponse(status_code=e.status_code, content={"success": False, "error": e.detail})
    except Exception as e:
        logging.error(f"Unexpected error in /api/save-lead-from-agent: {e}")
        return JSONResponse(status_code=500, content={"success": False, "error": str(e)})

@app.post("/api/test-post")
async def test_post():
    return {"success": True}

async def startup_event():
    print("=== ROUTES ON STARTUP ===")
    for route in app.routes:
        methods = getattr(route, "methods", None)
        print(route.path, methods)

app.add_event_handler("startup", startup_event)

@app.post("/api/save-lead-from-agent")
async def save_lead_from_agent(request: Request):
    try:
        data = await request.json()
        transcript = data.get("transcript")
        if not transcript or not isinstance(transcript, str):
            raise HTTPException(status_code=400, detail="Missing or invalid transcript.")
        # Extract CRM.save({...}) block
        crm_regex = r"CRM\.save\((\{[\s\S]*?\})\)"
        match = re.search(crm_regex, transcript)
        if not match:
            logging.warning(f"CRM.save block not found in transcript: {transcript}")
            raise HTTPException(status_code=400, detail="CRM.save block not found in transcript.")
        crm_block = match.group(1)
        # Clean up for JSON
        # Remove trailing commas
        crm_block = re.sub(r',\s*([}\]])', r'\1', crm_block)
        # Convert JS-style keys to quoted keys
        crm_block = re.sub(r'(\w+)\s*:', r'"\1":', crm_block)
        # Convert single quotes to double quotes
        crm_block = crm_block.replace("'", '"')
        try:
            lead_data = json.loads(crm_block)
        except Exception as e:
            logging.error(f"Error parsing CRM block to JSON: {e}")
            raise HTTPException(status_code=400, detail=f"Could not parse CRM.save block: {str(e)}")
        # Validate required fields
        if not lead_data.get("fullName") or not lead_data.get("phoneNumber"):
            logging.warning(f"Missing required fields in CRM block: {lead_data}")
            raise HTTPException(status_code=400, detail="Missing required fields: fullName and phoneNumber.")
        # Prepare Firestore doc
        doc_data = {k: lead_data.get(k, None) for k in [
            "fullName", "phoneNumber", "status", "timeline", "location", "budget", "financialStatus", "hasAgent", "motivation", "leadQuality", "nextStep"
        ]}
        doc_data["createdAt"] = firestore.SERVER_TIMESTAMP
        logging.warning(f"Extracted lead data: {doc_data}")
        doc_ref = db.collection("leads").document()
        doc_ref.set(doc_data)
        logging.warning(f"Saved lead to Firestore with ID: {doc_ref.id}")
        return JSONResponse({"success": True, "documentId": doc_ref.id})
    except HTTPException as e:
        return JSONResponse(status_code=e.status_code, content={"success": False, "error": e.detail})
    except Exception as e:
        logging.error(f"Unexpected error in /api/save-lead-from-agent: {e}")
        return JSONResponse(status_code=500, content={"success": False, "error": str(e)})

# --- System Prompt Management ---
async def update_agent_system_prompt(system_prompt: str):
    """Update the ElevenLabs agent with a new system prompt"""
    try:
        agent_id = os.getenv("ELEVENLABS_AGENT_ID")
        api_key = os.getenv("ELEVENLABS_API_KEY")
        
        if not agent_id or not api_key:
            logging.error("Missing ELEVENLABS_AGENT_ID or ELEVENLABS_API_KEY")
            return False, "Missing ElevenLabs credentials"
            
        # Get current agent configuration
        current_config = await get_agent_configuration()
        if not current_config:
            return False, "Failed to fetch current agent configuration"
            
        # Update the system prompt in the configuration
        conversation_config = current_config.get("conversation_config", {})
        agent_config = conversation_config.get("agent", {})
        prompt_config = agent_config.get("prompt", {})
        
        # Update the prompt
        prompt_config["prompt"] = system_prompt
        
        # Send updated configuration to ElevenLabs
        async with httpx.AsyncClient() as client:
            response = await client.patch(
                f"https://api.elevenlabs.io/v1/convai/agents/{agent_id}",
                headers={"xi-api-key": api_key, "Content-Type": "application/json"},
                json=current_config
            )
            
            if response.status_code == 200:
                logging.info(f"Successfully updated agent system prompt")
                return True, "System prompt updated successfully"
            else:
                logging.error(f"Failed to update agent: {response.status_code} - {response.text}")
                return False, f"API error: {response.status_code} - {response.text}"
                
    except Exception as e:
        logging.error(f"Error updating agent system prompt: {e}")
        return False, str(e)

async def save_system_prompt(name: str, prompt: str, description: str = "", is_default: bool = False):
    """Save a system prompt to Firestore"""
    try:
        prompt_data = {
            "name": name,
            "prompt": prompt,
            "description": description,
            "isDefault": is_default,
            "createdAt": firestore.SERVER_TIMESTAMP,
            "updatedAt": firestore.SERVER_TIMESTAMP
        }
        
        # If this is set as default, unset other defaults
        if is_default:
            prompts_ref = db.collection("systemPrompts")
            default_prompts = prompts_ref.where("isDefault", "==", True).stream()
            for doc in default_prompts:
                doc.reference.update({"isDefault": False})
        
        doc_ref = db.collection("systemPrompts").document()
        doc_ref.set(prompt_data)
        
        logging.info(f"Saved system prompt '{name}' with ID: {doc_ref.id}")
        return True, doc_ref.id
        
    except Exception as e:
        logging.error(f"Error saving system prompt: {e}")
        return False, str(e)

async def get_system_prompt(prompt_id: str = None, prompt_name: str = None):
    """Retrieve a system prompt from Firestore by ID or name"""
    try:
        prompts_ref = db.collection("systemPrompts")
        
        if prompt_id:
            doc = prompts_ref.document(prompt_id).get()
            if doc.exists:
                return doc.to_dict()
        elif prompt_name:
            docs = prompts_ref.where("name", "==", prompt_name).limit(1).stream()
            for doc in docs:
                return doc.to_dict()
        else:
            # Get default prompt
            docs = prompts_ref.where("isDefault", "==", True).limit(1).stream()
            for doc in docs:
                return doc.to_dict()
                
        return None
        
    except Exception as e:
        logging.error(f"Error retrieving system prompt: {e}")
        return None

async def list_system_prompts():
    """List all available system prompts"""
    try:
        prompts_ref = db.collection("systemPrompts")
        docs = prompts_ref.order_by("createdAt", direction=firestore.Query.DESCENDING).stream()
        
        prompts = []
        for doc in docs:
            prompt_data = doc.to_dict()
            prompts.append({
                "id": doc.id,
                "name": prompt_data.get("name"),
                "description": prompt_data.get("description", ""),
                "isDefault": prompt_data.get("isDefault", False),
                "createdAt": prompt_data.get("createdAt"),
                "updatedAt": prompt_data.get("updatedAt")
            })
        
        return prompts
        
    except Exception as e:
        logging.error(f"Error listing system prompts: {e}")
        return []

async def apply_system_prompt_to_agent(prompt_id: str = None, prompt_name: str = None):
    """Retrieve and apply a system prompt to the ElevenLabs agent"""
    try:
        # Get the prompt from database
        prompt_data = await get_system_prompt(prompt_id, prompt_name)
        if not prompt_data:
            return False, "System prompt not found"
        
        # Apply the prompt to the agent
        success, message = await update_agent_system_prompt(prompt_data["prompt"])
        
        if success:
            logging.info(f"Applied system prompt '{prompt_data['name']}' to agent")
            return True, f"Applied prompt: {prompt_data['name']}"
        else:
            return False, message
            
    except Exception as e:
        logging.error(f"Error applying system prompt to agent: {e}")
        return False, str(e)

# --- API Endpoints for System Prompt Management ---

@app.post("/api/system-prompts")
async def create_system_prompt(request: Request):
    """Create a new system prompt"""
    try:
        data = await request.json()
        name = data.get("name")
        prompt = data.get("prompt")
        description = data.get("description", "")
        is_default = data.get("isDefault", False)
        
        if not name or not prompt:
            return JSONResponse(
                status_code=400,
                content={"success": False, "error": "Name and prompt are required"}
            )
        
        success, result = await save_system_prompt(name, prompt, description, is_default)
        
        if success:
            return JSONResponse(
                status_code=201,
                content={"success": True, "id": result, "message": "System prompt created"}
            )
        else:
            return JSONResponse(
                status_code=400,
                content={"success": False, "error": result}
            )
            
    except Exception as e:
        logging.error(f"Error in create-system-prompt endpoint: {e}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)}
        )

@app.get("/api/system-prompts")
async def get_system_prompts():
    """List all system prompts"""
    try:
        prompts = await list_system_prompts()
        return JSONResponse(
            status_code=200,
            content={"success": True, "prompts": prompts}
        )
        
    except Exception as e:
        logging.error(f"Error in get-system-prompts endpoint: {e}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)}
        )

@app.get("/api/system-prompts/{prompt_id}")
async def get_system_prompt_by_id(prompt_id: str):
    """Get a specific system prompt by ID"""
    try:
        prompt_data = await get_system_prompt(prompt_id=prompt_id)
        
        if prompt_data:
            return JSONResponse(
                status_code=200,
                content={"success": True, "prompt": prompt_data}
            )
        else:
            return JSONResponse(
                status_code=404,
                content={"success": False, "error": "System prompt not found"}
            )
            
    except Exception as e:
        logging.error(f"Error in get-system-prompt endpoint: {e}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)}
        )

@app.post("/api/apply-system-prompt")
async def apply_system_prompt_endpoint(request: Request):
    """Apply a system prompt to the ElevenLabs agent"""
    try:
        data = await request.json()
        prompt_id = data.get("promptId")
        prompt_name = data.get("promptName")
        
        if not prompt_id and not prompt_name:
            return JSONResponse(
                status_code=400,
                content={"success": False, "error": "Either promptId or promptName is required"}
            )
        
        success, message = await apply_system_prompt_to_agent(prompt_id, prompt_name)
        
        if success:
            return JSONResponse(
                status_code=200,
                content={"success": True, "message": message}
            )
        else:
            return JSONResponse(
                status_code=400,
                content={"success": False, "error": message}
            )
            
    except Exception as e:
        logging.error(f"Error in apply-system-prompt endpoint: {e}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)}
        )


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
