"use client";

import ListEventContent from '@/components/ListEventContent';
import { useAuth } from '@/context/AuthContext';

export default function ListEvent() {
    const { organiser } = useAuth();
    // Key forces full remount when organiser changes, preventing any stale state
    return <ListEventContent key={organiser?.id || "guest"} />;
}
