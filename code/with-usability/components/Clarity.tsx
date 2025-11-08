"use client";
import Clarity from "@microsoft/clarity";
import { useEffect } from "react";

export default function ClarityInit() {
    useEffect(() => {
        if (typeof window !== "undefined") {
            Clarity.init('u2odquwutf');
        }
      }, []);

    return null;
}