
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from '@/lib/utils'; // Import the pre-initialized auth instance

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
        // Pre-fill form with user's display name and email from auth
        // Other fields (jobTitle, company, bio) would ideally be fetched from Firestore if a profile already exists.
        // For now, we'll initialize them based on defaultValues or previously entered data.
        form.reset({
          name: user.displayName || defaultValues.name,
          email: user.email || defaultValues.email,
          jobTitle: form.getValues().jobTitle || defaultValues.jobTitle, // Retain typed value or default
          company: form.getValues().company || defaultValues.company,   // Retain typed value or default
          bio: form.getValues().bio || defaultValues.bio,           // Retain typed value or default
        });
      } else {
        setCurrentUser(null);
        // Optionally, redirect or disable form if user is not authenticated, though AppLayout should handle major auth guarding.
      }
    });
    return () => unsubscribe();
  }, [form]); // form is included to allow re-initializing if form instance changes, though typically stable.


  async function onSubmit(data: ProfileFormValues) {
    setIsLoading(true);
    if (!currentUser || !currentUser.uid) { // Ensure UID is present
      toast({
        title: "Authentication Error",
        description: "You must be logged in with a valid user ID to save your profile.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      await saveProfile(currentUser.uid, data); // Pass UID to saveProfile
      toast({
        title: "Profile saved successfully!",
      });
    } catch (error) {
      console.error("Error saving profile from page:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({
        title: "Failed to save profile.",
        description: errorMessage, // This will now include the "Missing or insufficient permissions" detail
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
                  <Input placeholder="Your Name" {...field} value={field.value ?? ""} />
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
                  <Input type="email" placeholder="your@email.com" {...field} value={field.value ?? ""} />
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
                  <Input placeholder="e.g. Software Engineer" {...field} value={field.value ?? ""} />
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
                  <Input placeholder="e.g. Acme Corp" {...field} value={field.value ?? ""} />
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
                    value={field.value ?? ""}
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
