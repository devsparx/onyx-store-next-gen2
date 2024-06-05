import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Auth from "@/components/auth/Auth";
import NavBar from "@/components/NavBar";
import { isAuthenticated } from "@/utils/amplify-utils";
import { cookies } from "next/headers";
import { getCurrentUser } from "aws-amplify/auth/server";
import ConfigureAmplifyClientSide from "@/components/ConfigureAmplifyClientSide";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Onyx Store Next.js Amplify Gen2 App",
  description: "Generated by create next app",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <NavBar isSignedIn={await isAuthenticated()} />
        <Auth>{children}</Auth>
      </body>
    </html>
  );
}
