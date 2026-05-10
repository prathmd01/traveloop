"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { api, uploadFile } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ProfilePage() {
  const { user, refreshUser, logout } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [name, setName] = React.useState(user?.name || "");
  const [language, setLanguage] = React.useState(user?.language || "en");
  const [avatar, setAvatar] = React.useState(user?.avatar || "");
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  React.useEffect(() => {
    setName(user?.name || "");
    setLanguage(user?.language || "en");
    setAvatar(user?.avatar || "");
  }, [user]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api("/auth/me", {
        method: "PATCH",
        body: JSON.stringify({ name, language, avatar: avatar || null }),
      });
      toast({ title: "Profile updated" });
      await refreshUser();
    } catch {
      toast({ title: "Update failed", variant: "destructive" });
    }
  }

  async function onAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await uploadFile(file);
      setAvatar(res.url);
      await api("/auth/me", { method: "PATCH", body: JSON.stringify({ avatar: res.url }) });
      toast({ title: "Photo updated" });
      await refreshUser();
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    }
  }

  async function deleteAccount() {
    try {
      await api("/auth/me", { method: "DELETE" });
      logout();
      toast({ title: "Account deleted" });
      router.replace("/");
    } catch {
      toast({ title: "Could not delete", variant: "destructive" });
    }
  }

  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "TL";

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-semibold">Profile & settings</h1>
        <p className="text-muted-foreground">Identity, language, and account controls.</p>
      </motion.div>

      <Card className="rounded-2xl border bg-white/90 shadow-sm">
        <CardHeader>
          <CardTitle>Public profile</CardTitle>
          <CardDescription>Shown on shared trips and collaborator surfaces.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={saveProfile}>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border">
                <AvatarImage src={avatar || undefined} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div>
                <Label htmlFor="avatar">Profile photo</Label>
                <Input id="avatar" type="file" accept="image/*" className="mt-1 rounded-xl" onChange={onAvatar} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" className="rounded-xl" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="ja">日本語</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="rounded-xl">
              Save changes
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border border-destructive/30 bg-destructive/5 shadow-sm">
        <CardHeader>
          <CardTitle className="text-destructive">Danger zone</CardTitle>
          <CardDescription>Permanently remove your Traveloop account and trips.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" className="rounded-xl" type="button" onClick={() => setDeleteOpen(true)}>
            Delete account
          </Button>
        </CardContent>
      </Card>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>This action is irreversible.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" className="rounded-xl" onClick={deleteAccount}>
              Delete forever
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
