
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react"; // Added useEffect
import { useForm } from "react-hook-form";
import * as z from "zod";
import { getAuth, onAuthStateChanged, type User } from "firebase/auth"; // Added User type

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/page-header";
import { useToast } from "@/hooks/use-toast";
import { saveProfile } from "./actions";
import { app } from "@/lib/firebase/firebase"; // Import the Firebase app instance

const auth = getAuth(app); // Initialize auth using the app instance

const profileFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  jobTitle: z.string().optional(),
  company: z.string().optional(),
  bio: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

// Default values should be strings for controlled components
const defaultValues: ProfileFormValues = {
  name: "",
  email: "",
  jobTitle: "",
  company: "",
  bio: "",
};

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { toast } = useToast();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
    mode: "onChange",
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        // Optionally pre-fill form if data exists, or ensure email is current user's email
        form.reset({
          name: user.displayName || "", // Or fetch from Firestore if profile exists
          email: user.email || "", // Auth email, user can change if desired in form
          jobTitle: "", // Fetch from Firestore if profile exists
          company: "", // Fetch from Firestore if profile exists
          bio: "", // Fetch from Firestore if profile exists
        });
      } else {
        setCurrentUser(null);
        // Handle user not being authenticated if necessary, though AppLayout should cover this
      }
    });
    return () => unsubscribe();
  }, [form]);


  async function onSubmit(data: ProfileFormValues) {
    setIsLoading(true);
    if (!currentUser) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to save your profile.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      await saveProfile(currentUser.uid, data);
      toast({
        title: "Profile saved successfully!",
      });
    } catch (error) {
      console.error("Error saving profile:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({
        title: "Failed to save profile.",
        description: errorMessage,
        variant: "destructive",
      });
    }
    setIsLoading(false);
  }

  return (
    <div className="container flex flex-col gap-4">
      <PageHeader
        title="Profile"
        description="Manage your professional profile information."
      />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Your Name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="your@email.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="jobTitle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job Title</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Software Engineer" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="company"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Acme Corp" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bio</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Tell us a little about yourself..."
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isLoading || !currentUser}>
            Save Profile
          </Button>
        </form>
      </Form>
    </div>
  );
}
