"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function RequestPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect parents straight to the parent application flow
    router.replace("/parent-application");
  }, [router]);

  return (
    <div className="max-w-3xl mx-auto py-10">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900">
            Parent Application
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-gray-700">
          <p>
            We now collect parent requests directly through the Parent Application page.
            You are being redirected. If nothing happens, use the button below.
          </p>
          <Button onClick={() => router.push("/parent-application")}>
            Go to Parent Application <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
