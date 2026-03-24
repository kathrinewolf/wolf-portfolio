import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Alexander Wolf Pedersen — Profile Photo",
  robots: "noindex, nofollow",
};

export default function ProfilePhotoPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#050507",
      }}
    >
      <img
        src="/content/profile-photo.jpg"
        alt="Alexander Wolf Pedersen"
        width={400}
        height={400}
        style={{
          borderRadius: "50%",
          objectFit: "cover",
          display: "block",
        }}
      />
    </div>
  );
}
