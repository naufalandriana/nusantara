import type { Metadata } from "next";
import "./global.css";

export const metadata: Metadata = {
    title: "Admin — NusaAssets",
    description: "Management Portal",
};

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}