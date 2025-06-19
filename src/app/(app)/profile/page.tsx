
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
  }).readonly(),
  jobTitle: z.string().optional(),
  company: z.string().optional(),
  bio: z.string().max(200, { message: "Bio must be 200 characters or less." }).optional(),
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
    console.log("[ProfilePage] Setting up onAuthStateChanged listener.");
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        console.log("[ProfilePage] User authenticated. UID:", user.uid, "Email:", user.email);
        form.reset({
          name: user.displayName || defaultValues.name,
          email: user.email || defaultValues.email,
          jobTitle: form.getValues().jobTitle || defaultValues.jobTitle,
          company: form.getValues().company || defaultValues.company,
          bio: form.getValues().bio || defaultValues.bio,
        });
      } else {
        setCurrentUser(null);
        console.log("[ProfilePage] No current user / User logged out.");
      }
    });
    return () => {
      console.log("[ProfilePage] Cleaning up onAuthStateChanged listener.");
      unsubscribe();
    };
  }, []); // Dependency array changed to empty for stable listener setup

  async function onSubmit(data: ProfileFormValues) {
    setIsLoading(true);
    if (!currentUser || !currentUser.uid) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in with a valid user ID to save your profile.",
        variant: "destructive",
      });
      console.error("[ProfilePage] onSubmit: currentUser or currentUser.uid is null/undefined. UID:", currentUser?.uid);
      setIsLoading(false);
      return;
    }

    console.log("[ProfilePage] Submitting profile for UID:", currentUser.uid, "with data:", data);

    try {
      const result = await saveProfile(currentUser.uid, data);
      toast({
        title: result.message || "Profile saved successfully!",
      });
    } catch (error) {
      console.error("[ProfilePage] Error saving profile from page:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({
        title: "Failed to save profile.",
        description: errorMessage, // This will now show the "Missing or insufficient permissions"
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
                  <Input type="email" placeholder="your@email.com" {...field} value={field.value ?? ""} readOnly />
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
                    maxLength={200}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isLoading || !currentUser}>
            {isLoading ? "Saving..." : "Save Profile"}
          </Button>
        </form>
      </Form>
    </div>
  );
}

    