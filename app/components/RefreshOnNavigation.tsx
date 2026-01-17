"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

export default function RefreshOnNavigation() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Initialize with the current path to avoid refreshing on the very first render
    // (since a hard load already fetches fresh data from the server)
    const lastPathRef = useRef(`${pathname}?${searchParams.toString()}`);

    useEffect(() => {
        const currentPath = `${pathname}?${searchParams.toString()}`;

        // Only refresh if the path has changed since the last tracking
        if (currentPath !== lastPathRef.current) {
            console.log(`🔄 Navigation detected (Hard Refresh): ${currentPath}`);
            lastPathRef.current = currentPath;

            // Force a hard reload to fix CSS/Layout issues
            window.location.reload();
        }
    }, [pathname, searchParams]);

    return null;
}
