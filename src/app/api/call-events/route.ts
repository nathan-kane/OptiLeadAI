import { NextRequest, NextResponse } from 'next/server';

// Custom interface for SSE connections
interface SSEWriter {
  write: (data: string) => void;
}

// Store active SSE connections
const connections = new Set<SSEWriter>();

// Store for broadcasting events to all connections
let eventBroadcaster: {
  broadcast: (event: any) => void;
} | null = null;

export async function GET(req: NextRequest) {
  // Set up SSE headers
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control',
  });

  // Create a readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      
      // Send initial connection event
      const connectEvent = `data: ${JSON.stringify({
        type: 'connected',
        timestamp: new Date().toISOString()
      })}\n\n`;
      controller.enqueue(encoder.encode(connectEvent));

      // Set up heartbeat to keep connection alive
      const heartbeatInterval = setInterval(() => {
        try {
          const heartbeat = `data: ${JSON.stringify({
            type: 'heartbeat',
            timestamp: new Date().toISOString()
          })}\n\n`;
          controller.enqueue(encoder.encode(heartbeat));
        } catch (error) {
          console.error('SSE heartbeat error:', error);
          clearInterval(heartbeatInterval);
          controller.close();
        }
      }, 30000); // Every 30 seconds

      // Store connection for broadcasting
      const writer = {
        write: (data: string) => {
          try {
            controller.enqueue(encoder.encode(data));
          } catch (error) {
            console.error('SSE write error:', error);
            connections.delete(writer);
          }
        }
      };
      connections.add(writer);

      // Set up event broadcaster if not already done
      if (!eventBroadcaster) {
        eventBroadcaster = {
          broadcast: (event: any) => {
            const eventData = `data: ${JSON.stringify(event)}\n\n`;
            connections.forEach(connection => {
              try {
                connection.write(eventData);
              } catch (error) {
                console.error('SSE broadcast error:', error);
                connections.delete(connection);
              }
            });
          }
        };
      }

      // Clean up on close
      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeatInterval);
        connections.delete(writer);
        controller.close();
      });
    }
  });

  return new NextResponse(stream, { headers });
}

// Export function to broadcast call completion events
export function broadcastCallCompleted(callData: {
  conversation_id: string;
  agent_id: string;
  phone_number: string;
  document_id: string;
  lead_data: any;
}) {
  if (eventBroadcaster) {
    eventBroadcaster.broadcast({
      type: 'call_ended',
      timestamp: new Date().toISOString(),
      data: {
        ...callData,
        timestamp: new Date().toISOString()
      }
    });
    console.log(`[SSE] Broadcasted call_ended event for ${callData.phone_number}`);
  }
}
