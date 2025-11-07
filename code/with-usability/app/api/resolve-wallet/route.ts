import { NextRequest, NextResponse } from "next/server";

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
const PRIVY_APP_SECRET = process.env.NEXT_PUBLIC_PRIVY_APP_SECRET;

export async function POST(req: NextRequest) {

  if (!PRIVY_APP_ID || !PRIVY_APP_SECRET) {
    return NextResponse.json({ error: "Missing PRIVY_APP_ID or PRIVY_APP_SECRET" }, { status: 500 });
  }

  try {
    const { email } = await req.json();
    
    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }

    const response = await fetch("https://api.privy.io/v1/users/email/address", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Basic " + Buffer.from(`${PRIVY_APP_ID}:${PRIVY_APP_SECRET}`).toString("base64"),
        "privy-app-id": PRIVY_APP_ID,
      },
      body: JSON.stringify({ address: email.toLowerCase() }),
    });
    
    if (!response.ok) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    const userData = await response.json();
    const smartWalletAccount = userData.linked_accounts.find((acc: any) => acc.type === "smart_wallet");
    
    if (!smartWalletAccount) {
      return NextResponse.json({ error: "No smart wallet found for this user" }, { status: 404 });
    }
    
    return NextResponse.json({
      walletAddress: smartWalletAccount.address,
      displayName: userData.name ?? null,
    });
  } catch (err) {
    console.error("Privy lookup error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}