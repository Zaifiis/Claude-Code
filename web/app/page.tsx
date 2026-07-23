import { SplineSceneBasic } from "@/components/spline-demo";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black p-8">
      <div className="w-full max-w-4xl">
        <SplineSceneBasic />
      </div>
    </div>
  );
}
