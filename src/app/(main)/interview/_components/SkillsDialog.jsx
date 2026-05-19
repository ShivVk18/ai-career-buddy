"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SkillsDialog() {
  const [skills, setSkills] = useState("");
  const router = useRouter();

  const handleStart = () => {
    const skillArray = skills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const query = encodeURIComponent(skillArray.join(","));

    router.push(`/interview/mock?skills=${query}`);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-[#f59e0b] to-[#fbbf24] text-white">
          Start Quiz
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-[#1a1815] border-[#f59e0b]/20 text-white">
        <DialogHeader>
          <DialogTitle className="text-[#fbbf24]">
            Enter Your Tech Stack
          </DialogTitle>
        </DialogHeader>

        <Input
          placeholder="React, Node, MongoDB"
          value={skills}
          onChange={(e) => setSkills(e.target.value)}
          className="bg-black/40 border-[#f59e0b]/20"
        />

        <DialogFooter>
          <Button
            onClick={handleStart}
            className="bg-gradient-to-r from-[#f59e0b] to-[#fbbf24]"
          >
            Generate AI Quiz
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}