"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import Link from "next/link";
import Footer from "@/components/Footer";
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play as PlayIcon,
  X,
  FileText,
  Utensils,
  HeartHandshake,
  Stethoscope,
  CheckCircle,
  GraduationCap,
  Gamepad2,
  Bed,
} from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

interface Room {
  id: string;
  name: string;
  ageRange: string;
  current: number;
  max: number;
  color: string;
  icon: string;
}

interface Announcement {
  id: number;
  title: string;
  content: string;
  type: string;
  createdAt: string;
  isRead: boolean;
}

const getRoomIcon = (name: string) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes("infant")) return "👶";
  if (lowerName.includes("toddler")) return "🧸";
  if (lowerName.includes("growing")) return "🌱";
  return "🎓";
};

const getRoomColor = (name: string) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes("infant"))
    return "bg-sky-50 text-sky-600 border-sky-100";
  if (lowerName.includes("toddler"))
    return "bg-emerald-50 text-emerald-600 border-emerald-100";
  if (lowerName.includes("growing"))
    return "bg-violet-50 text-violet-600 border-violet-100";
  return "bg-amber-50 text-amber-600 border-amber-100";
};

const services = [
  {
    Icon: Utensils,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-100",
    title: "Nutritious Meals",
    items: ["Daily fresh meals", "Dietary options", "Fresh produce"],
  },
  {
    Icon: Gamepad2,
    color: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-100",
    title: "Educational Games",
    items: ["Interactive play", "Arts & crafts", "Teamwork"],
  },
  {
    Icon: Bed,
    color: "text-sky-600",
    bg: "bg-sky-50",
    border: "border-sky-100",
    title: "Comfortable Rest",
    items: ["Personal nap areas", "Clean bedding", "Quiet time"],
  },
  {
    Icon: GraduationCap,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    border: "border-indigo-100",
    title: "Life Skills",
    items: ["Self-care", "Communication", "Problem-solving"],
  },
  {
    Icon: Stethoscope,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    title: "Health Monitoring",
    items: ["Daily checks", "Medication", "First aid"],
  },
  {
    Icon: HeartHandshake,
    color: "text-pink-600",
    bg: "bg-pink-50",
    border: "border-pink-100",
    title: "Emotional Support",
    items: ["1-on-1 care", "Positive guidance", "Confidence building"],
  },
];

const requirements = [
  {
    title: "Required Documents",
    Icon: FileText,
    color: "text-violet-600",
    bg: "bg-violet-50",
    items: [
      "Medical Report",
      "Birth Certificate",
      "Vaccination Records",
      "Parent/Guardian ID",
      "Emergency Contacts",
      "2 Passport Photos",
    ],
  },
  {
    title: "Personal Items",
    Icon: Utensils,
    color: "text-amber-600",
    bg: "bg-amber-50",
    items: [
      "Extra Clothes",
      "Blanket",
      "Diapers/Wipes",
      "Water Bottle",
      "Comfort Item",
      "Outerwear",
    ],
  },
];

export default function HomePage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [pendingEnrollmentRequests, setPendingEnrollmentRequests] = useState<
    any[]
  >([]);
  const [filter, setFilter] = useState<"pending" | "all">("pending");
  const [enrollmentPage, setEnrollmentPage] = useState(1);
  const enrollmentPageSize = 10;
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [positionInfo, setPositionInfo] = useState<{
    index: number | null;
    before: number;
    beforeList: any[];
  } | null>(null);
  const [searchMatches, setSearchMatches] = useState<any[]>([]);
  // Carousel state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const images = [
    "/daycare1.jpg",
    "/daycare2.jpg",
    "/daycare3.jpg",
    "/daycare4.jpg",
  ];

  // Fetch rooms and enrollment requests (supports filter & dedup)
  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      // fetch pending/filtered enrollment requests
      const params = new URLSearchParams();
      if (filter === "pending") params.set("status", "pending");
      params.set("sort", "asc");
      // prioritize women where requested by default
      params.set("prioritizeWomen", "true");
      const resp = await fetch(`/api/enrollment-requests?${params.toString()}`);
      if (resp.ok) {
        const json = await resp.json();
        // Use full API list (no deduplication) and normalize email/status
        const list = (json?.data || []).map((r: any) => ({
          ...r,
          status: String(r.status || "pending").toLowerCase(),
          email: String(r.email || "")
            .toLowerCase()
            .trim(),
        }));
        setPendingEnrollmentRequests(list);
      } else {
        console.warn("Failed to load enrollment requests", resp.status);
        setPendingEnrollmentRequests([]);
      }
    } catch (err) {
      console.error("Error loading enrollment requests:", err);
      setPendingEnrollmentRequests([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // load rooms once and requests
    let mounted = true;
    const loadRooms = async () => {
      try {
        const roomsResp = await fetch("/api/rooms");
        if (roomsResp.ok && mounted) {
          const roomsData = await roomsResp.json();
          setRooms(
            roomsData.map((room: any) => ({
              id: room.id,
              name: room.name,
              ageRange: room.ageRange || "All ages",
              current: room.childrenCount || 0,
              max: room.maxCapacity || 30,
              color: getRoomColor(room.name),
              icon: getRoomIcon(room.name),
            }))
          );
        }
      } catch (err) {
        console.error("Error loading rooms:", err);
      }
    };

    loadRooms();
    fetchRequests();
    return () => {
      mounted = false;
    };
  }, []);

  // reload when filter changes
  useEffect(() => {
    setEnrollmentPage(1);
    fetchRequests();
  }, [filter]);

  // Allow retrying pending requests fetch from the UI for debugging
  const reloadPending = async () => {
    await fetchRequests();
  };
  function PositionLookup({
    positionInfo,
  }: {
    positionInfo: {
      index: number | null;
      before: number;
      beforeList: any[];
    } | null;
  }) {
    return (
      <div className="bg-white border border-slate-100 p-4 rounded-lg">
        {positionInfo ? (
          positionInfo.index === null ? (
            <div className="text-sm text-gray-600">
              No pending request found for that query.
            </div>
          ) : (
            <div>
              <div className="text-sm text-gray-700 mb-2">
                {positionInfo.before === 0 ? null : (
                  <>
                    There are{" "}
                    <span className="font-medium">{positionInfo.before}</span>{" "}
                    people ahead of you in the queue.
                  </>
                )}
              </div>
              {positionInfo.beforeList.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          #
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Parent
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Child
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Email
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Phone
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                      {positionInfo.beforeList.map((r, i) => (
                        <tr key={r.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-sm text-gray-700">
                            {i + 1}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900">
                            {r.parentName}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-700">
                            {r.childName}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-700">
                            {r.email}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-700">
                            {r.phone || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        ) : (
          <div className="text-sm text-gray-600">
            Enter a search above to find your place in the queue.
          </div>
        )}
      </div>
    );
  }
  const prevImage = () =>
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  const nextImage = () =>
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  const goToImage = (index: number) => setCurrentImageIndex(index);
  const toggleAutoPlay = () => setIsAutoPlaying(!isAutoPlaying);
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    if (!isFullscreen) setIsAutoPlaying(false);
  };

  const handleSearch = () => {
    console.debug("handleSearch called", {
      searchQuery,
      pendingCount: pendingEnrollmentRequests.length,
    });
    const qRaw = String(searchQuery || "").trim();
    if (!qRaw) {
      setPositionInfo(null);
      return;
    }

    // normalize and prepare tokens
    const normalize = (s: string) =>
      s
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .replace(/\s+/g, " ")
        .trim();

    const q = normalize(qRaw);
    const qDigits = q.replace(/\D/g, "");
    const qTokens = q.split(" ").filter(Boolean);

    const matchedList: any[] = [];

    for (let i = 0; i < pendingEnrollmentRequests.length; i++) {
      const r = pendingEnrollmentRequests[i];
      const parent = normalize(String(r.parentName || ""));
      const email = normalize(String(r.email || ""));
      const child = normalize(String(r.childName || ""));
      const phone = String(r.phone || "").replace(/\D/g, "");
      const notes = normalize(String(r.notes || ""));

      let matched = false;

      // direct digit match for phone
      if (qDigits && phone.includes(qDigits)) matched = true;

      // direct contains
      if (
        !matched &&
        (parent.includes(q) ||
          email.includes(q) ||
          child.includes(q) ||
          notes.includes(q))
      )
        matched = true;

      // token match: every token should appear in one of the fields (loose AND)
      if (!matched && qTokens.length > 0) {
        const allTokensFound = qTokens.every(
          (t) =>
            parent.includes(t) ||
            email.includes(t) ||
            child.includes(t) ||
            notes.includes(t)
        );
        if (allTokensFound) matched = true;
      }

      if (matched) matchedList.push({ _idx: i, ...r });
    }

    if (matchedList.length === 0) {
      setSearchMatches([]);
      setPositionInfo({ index: null, before: 0, beforeList: [] });
    } else {
      // build list of matched items (preserve original order)
      setSearchMatches(matchedList);
      // auto-select the earliest match so user sees immediate result
      const idx = matchedList[0]._idx as number;
      const beforeList = pendingEnrollmentRequests.slice(0, idx);
      setPositionInfo({ index: idx, before: idx, beforeList });
    }
  };

  const RoomCard = ({ room }: { room: Room }) => {
    const percentage = Math.min(
      100,
      Math.round((room.current / room.max) * 100)
    );
    const availableSlots = Math.max(0, room.max - room.current);

    return (
      <Card className="bg-white border-slate-200 hover:border-slate-300 transition-all p-6 rounded-3xl relative overflow-hidden shadow-sm hover:shadow-md">
        <div
          className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${room.color
            .split(" ")[0]
            .replace("bg-", "from-")
            .replace("/10", "/5")} to-transparent rounded-bl-full opacity-50`}
        />

        <div className="relative z-10">
          <div
            className={`w-12 h-12 rounded-2xl ${room.color} flex items-center justify-center mb-6 text-2xl`}
          >
            {room.icon}
          </div>

          <h3 className="text-lg font-bold text-slate-900 mb-1">{room.name}</h3>
          <p className="text-slate-500 text-sm mb-6">{room.ageRange}</p>

          <div className="flex justify-between items-end mb-2">
            <div>
              <div className="text-2xl font-bold text-slate-900">
                {room.current}
                <span className="text-sm text-slate-500 font-normal">
                  /{room.max}
                </span>
              </div>
              <div className="text-sm text-slate-500 mt-1">
                {availableSlots} slot{availableSlots !== 1 ? "s" : ""} available
              </div>
            </div>

            <div
              className={`text-xs font-medium px-2 py-1 rounded-full ${
                percentage >= 100
                  ? "bg-red-50 text-red-600"
                  : "bg-green-50 text-green-600"
              }`}
            >
              {percentage >= 100 ? "Full" : "Available"}
            </div>
          </div>

          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                percentage >= 90 ? "bg-red-500" : "bg-indigo-500"
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </Card>
    );
  };

  // Helper to parse parent gender from notes text
  const parseParentGender = (notes: string | null | undefined) => {
    if (!notes) return "N/A";
    try {
      const txt = String(notes).toUpperCase();
      const m = txt.match(
        /PARENT\s*GENDER\s*[:\-]?\s*(MALE|FEMALE|OTHER|PREFER_NOT|PREFER_NOT_TO_SAY|PREFER_NOT_TO_SAY|PREFER_NOT|PREFER_NOT_TO)/i
      );
      if (m && m[1]) {
        const v = String(m[1]).toUpperCase();
        if (v === "MALE") return "Male";
        if (v === "FEMALE") return "Female";
        if (v === "OTHER") return "Other";
        if (v.startsWith("PREFER")) return "Prefer not to say";
        return v.charAt(0) + v.slice(1).toLowerCase();
      }

      // fallback heuristics
      if (
        txt.includes("MOTHER") ||
        txt.includes("WOMAN") ||
        txt.includes("WOMEN")
      )
        return "Female";
      if (txt.includes("FATHER") || txt.includes("MAN")) return "Male";
      return "N/A";
    } catch {
      return "N/A";
    }
  };

  // Normalize helper reused by search
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/\s+/g, " ")
      .trim();

  const matchesQuery = (r: any, q: string) => {
    const qRaw = String(q || "").trim();
    if (!qRaw) return true;
    const qNorm = normalize(qRaw);
    const qDigits = qNorm.replace(/\D/g, "");
    const qTokens = qNorm.split(" ").filter(Boolean);

    const parent = normalize(String(r.parentName || ""));
    const email = normalize(String(r.email || ""));
    const child = normalize(String(r.childName || ""));
    const phone = String(r.phone || "").replace(/\D/g, "");
    const notes = normalize(String(r.notes || ""));

    // direct digit match for phone
    if (qDigits && phone.includes(qDigits)) return true;

    // direct contains
    if (
      parent.includes(qNorm) ||
      email.includes(qNorm) ||
      child.includes(qNorm) ||
      notes.includes(qNorm)
    )
      return true;

    // token match: every token should appear in one of the fields (loose AND)
    if (qTokens.length > 0) {
      const allTokensFound = qTokens.every(
        (t) =>
          parent.includes(t) ||
          email.includes(t) ||
          child.includes(t) ||
          notes.includes(t)
      );
      if (allTokensFound) return true;
    }

    return false;
  };

  // Run search automatically when `searchQuery` or `pendingEnrollmentRequests` changes
  useEffect(() => {
    const qRaw = String(searchQuery || "").trim();
    if (!qRaw) {
      setSearchMatches([]);
      setPositionInfo(null);
      setEnrollmentPage(1);
      return;
    }

    const matchedList: any[] = [];
    for (let i = 0; i < pendingEnrollmentRequests.length; i++) {
      const r = pendingEnrollmentRequests[i];
      if (matchesQuery(r, qRaw)) matchedList.push({ _idx: i, ...r });
    }

    if (matchedList.length === 0) {
      setSearchMatches([]);
      setPositionInfo({ index: null, before: 0, beforeList: [] });
    } else {
      setSearchMatches(matchedList);
      const idx = matchedList[0]._idx as number;
      const beforeList = pendingEnrollmentRequests.slice(0, idx);
      setPositionInfo({ index: idx, before: idx, beforeList });
      // when there are matches, show the page containing the earliest match
      const pageForMatch = Math.floor(idx / enrollmentPageSize) + 1;
      setEnrollmentPage(pageForMatch);
    }
  }, [searchQuery, pendingEnrollmentRequests]);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans overflow-x-hidden">
      {/* Background Grid */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-grid-black/[0.02] bg-[size:50px_50px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white" />
      </div>

      <div className="relative z-10">
        <Navigation />

        {/* Hero Carousel */}
        <section className="relative h-screen w-full overflow-hidden">
          <div className="relative w-full h-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentImageIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7 }}
                className="relative w-full h-full"
              >
                <Image
                  src={images[currentImageIndex]}
                  alt={`Daycare Gallery ${currentImageIndex + 1}`}
                  fill
                  className="object-cover cursor-pointer"
                  priority
                  onClick={toggleFullscreen}
                />
                <div className="absolute inset-0 bg-black/20" />

                {/* Top Text Content */}
                <div className="absolute top-20 left-0 right-0 text-center text-white px-6">
                  <motion.h1
                    initial={{ y: -30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    className="text-4xl md:text-6xl font-bold mb-4 drop-shadow-2xl"
                  >
                    Welcome to INSA Daycare
                  </motion.h1>
                  <motion.p
                    initial={{ y: -30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.8 }}
                    className="text-lg md:text-xl drop-shadow-lg opacity-90"
                  >
                    Where every child's journey begins with love and learning
                  </motion.p>
                </div>

                {/* Controls Bar */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-sm rounded-2xl px-6 py-3 flex items-center gap-4">
                  <button
                    onClick={toggleAutoPlay}
                    className="text-white hover:text-amber-200 transition-colors"
                  >
                    {isAutoPlaying ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <PlayIcon className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    onClick={prevImage}
                    className="text-white hover:text-amber-200 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <div className="flex gap-2 mx-2">
                    {images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => goToImage(index)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === currentImageIndex
                            ? "bg-white"
                            : "bg-white/50 hover:bg-white/70"
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={nextImage}
                    className="text-white hover:text-amber-200 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>

                  <div className="text-white text-sm font-medium ml-2">
                    {currentImageIndex + 1} / {images.length}
                  </div>

                  <button
                    onClick={toggleFullscreen}
                    className="text-white hover:text-amber-200 transition-colors ml-2"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                      />
                    </svg>
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </section>

        {/* Fullscreen Modal */}
        <AnimatePresence>
          {isFullscreen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black flex items-center justify-center"
            >
              <button
                onClick={() => setIsFullscreen(false)}
                className="absolute top-4 right-4 z-60 text-white hover:text-amber-200 transition-colors p-2"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="relative w-full h-full flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentImageIndex}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                    className="relative w-full h-full max-w-7xl max-h-[90vh] mx-auto"
                  >
                    <Image
                      src={images[currentImageIndex]}
                      alt={`Daycare Gallery ${currentImageIndex + 1}`}
                      fill
                      className="object-contain"
                    />
                  </motion.div>
                </AnimatePresence>

                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm rounded-2xl px-6 py-3 flex items-center gap-4">
                  <button
                    onClick={prevImage}
                    className="text-white hover:text-amber-200 transition-colors"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>

                  <div className="flex gap-2 mx-4">
                    {images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => goToImage(index)}
                        className={`w-3 h-3 rounded-full transition-all ${
                          index === currentImageIndex
                            ? "bg-white"
                            : "bg-white/50 hover:bg-white/70"
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={nextImage}
                    className="text-white hover:text-amber-200 transition-colors"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>

                  <div className="text-white text-sm font-medium ml-4 border-l border-white/30 pl-4">
                    {currentImageIndex + 1} / {images.length}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Room Availability */}
        <section
          id="room-availability"
          className="py-24 px-6 border-b border-slate-100"
        >
          <div className="max-w-7xl mx-auto">
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-slate-900 mb-2">
                Our Classrooms
              </h2>
              <p className="text-slate-600">
                We maintain small class sizes to ensure personalized attention
                for every child.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {isLoading
                ? [1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-64 bg-slate-100 rounded-2xl animate-pulse border border-slate-200"
                    />
                  ))
                : rooms.map((room) => <RoomCard key={room.id} room={room} />)}
            </div>
          </div>
        </section>

        {/* Pending Enrollment */}
        <section id="pending-enrollment" className="py-8 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-slate-900">
                New Enrollment Requests
              </h3>
              <p className="text-sm text-slate-500">
                Number of parents who have requested to join the daycare.
              </p>
            </div>

            <div className="w-full">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Pending requests
                    </p>
                    <p className="text-2xl font-bold text-slate-900">
                      {pendingEnrollmentRequests.length}
                    </p>
                  </div>
                </div>

                {/* Search input for finding position by name/email/phone/child */}
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex rounded-md border border-blue-200 overflow-hidden">
                    <button
                      className={`px-3 py-1 text-sm ${
                        filter === "pending"
                          ? "bg-blue-600 text-white"
                          : "bg-white text-blue-600"
                      }`}
                      onClick={() => setFilter("pending")}
                    >
                      Pending
                    </button>
                    <button
                      className={`px-3 py-1 text-sm ${
                        filter === "all"
                          ? "bg-blue-600 text-white"
                          : "bg-white text-blue-600"
                      }`}
                      onClick={() => setFilter("all")}
                    >
                      All
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder="Search by name, email, phone, or child name"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64 md:w-80 px-2 py-2 border border-gray-200 rounded-md text-sm"
                  />
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setSearchQuery("");
                      setPositionInfo(null);
                    }}
                  >
                    Clear
                  </Button>
                  {!isLoading && pendingEnrollmentRequests.length === 0 && (
                    <div className="ml-2">
                      <div className="text-sm text-gray-500">
                        No pending requests loaded.
                      </div>
                      <Button
                        size="sm"
                        variant="link"
                        onClick={() => reloadPending()}
                      >
                        Retry
                      </Button>
                    </div>
                  )}
                </div>

                {/* Search now directly filters the table like the admin view; no matches dropdown */}

                {pendingEnrollmentRequests.length > 0 ? (
                  <div className="mt-4">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-100">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              #
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Parent
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Parent Gender
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Queue
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Child
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Age
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Email
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Phone
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Preferred Start
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Requested At
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                          {(
                            (searchQuery
                              ? pendingEnrollmentRequests
                                  .map((r: any, i: number) => ({
                                    ...r,
                                    _idx: i,
                                  }))
                                  .filter((r: any) =>
                                    matchesQuery(r, searchQuery)
                                  )
                              : pendingEnrollmentRequests.slice(
                                  (enrollmentPage - 1) * enrollmentPageSize,
                                  enrollmentPage * enrollmentPageSize
                                )) as any[]
                          ).map((r: any, idx: number) => {
                            const created = r.createdAt
                              ? new Date(r.createdAt)
                              : null;
                            const preferred = r.preferredStartDate
                              ? new Date(r.preferredStartDate)
                              : null;
                            // compute absolute position in the full pending list
                            const absoluteIdx = searchQuery
                              ? r._idx !== undefined
                                ? r._idx
                                : idx
                              : (enrollmentPage - 1) * enrollmentPageSize + idx;
                            const isPriority =
                              parseParentGender(r.notes) === "Female";
                            return (
                              <tr key={r.id} className="hover:bg-gray-50">
                                <td className="px-4 py-2 text-sm text-gray-700">
                                  {searchQuery
                                    ? r._idx !== undefined
                                      ? r._idx + 1
                                      : idx + 1
                                    : (enrollmentPage - 1) *
                                        enrollmentPageSize +
                                      idx +
                                      1}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-900">
                                  {r.parentName}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-700">
                                  {parseParentGender(r.notes)}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-700">
                                  {isPriority
                                    ? "Priority"
                                    : `Queue ${absoluteIdx + 1}`}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-700">
                                  {r.childName}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-700">
                                  {r.childAge}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-700">
                                  {r.email}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-700">
                                  {r.phone || "—"}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-700">
                                  {preferred
                                    ? preferred.toLocaleDateString()
                                    : "—"}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-500">
                                  {created ? created.toLocaleString() : ""}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-4 flex items-center justify-end">
                      {pendingEnrollmentRequests.length >
                        enrollmentPageSize && (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() =>
                              setEnrollmentPage((p) => Math.max(1, p - 1))
                            }
                            disabled={enrollmentPage === 1}
                          >
                            Prev
                          </Button>

                          <div className="text-sm">
                            Page {enrollmentPage} /{" "}
                            {Math.ceil(
                              pendingEnrollmentRequests.length /
                                enrollmentPageSize
                            )}
                          </div>

                          <Button
                            size="sm"
                            onClick={() =>
                              setEnrollmentPage((p) =>
                                Math.min(
                                  Math.ceil(
                                    pendingEnrollmentRequests.length /
                                      enrollmentPageSize
                                  ),
                                  p + 1
                                )
                              )
                            }
                            disabled={
                              enrollmentPage ===
                              Math.ceil(
                                pendingEnrollmentRequests.length /
                                  enrollmentPageSize
                              )
                            }
                          >
                            Next
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 text-sm text-slate-500">
                    No pending enrollment requests.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Services */}
        <section id="services" className="py-24 px-6 relative">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <Badge
                variant="outline"
                className="mb-4 border-amber-200 bg-amber-50 text-amber-700"
              >
                <HeartHandshake className="w-3 h-3 mr-2" /> Our Services
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                Comprehensive Childcare
              </h2>
              <p className="text-slate-600 max-w-2xl mx-auto">
                Everything your child needs for a balanced and happy
                development.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map(({ Icon, color, bg, border, title, items }, i) => (
                <div
                  key={i}
                  className="bg-white border border-slate-200 rounded-3xl p-8 hover:border-slate-300 transition-colors shadow-sm hover:shadow-md"
                >
                  <div
                    className={`w-12 h-12 rounded-2xl ${bg} flex items-center justify-center mb-6 border ${border}`}
                  >
                    <Icon className={`w-6 h-6 ${color}`} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-4">
                    {title}
                  </h3>
                  <ul className="space-y-3">
                    {items.map((item, j) => (
                      <li
                        key={j}
                        className="flex items-center gap-3 text-slate-600 text-sm"
                      >
                        <CheckCircle className="h-4 w-4 text-slate-400 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Requirements */}
        <section
          id="requirements"
          className="py-24 px-6 border-t border-slate-100 bg-slate-50/50"
        >
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <Badge
                variant="outline"
                className="mb-4 border-emerald-200 bg-emerald-50 text-emerald-700"
              >
                <FileText className="w-3 h-3 mr-2" /> Enrollment
              </Badge>
              <h2 className="text-3xl font-bold text-slate-900">
                Enrollment Requirements
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {requirements.map(({ title, Icon, color, bg, items }, i) => (
                <div
                  key={i}
                  className="bg-white border border-slate-200 rounded-3xl p-8 hover:border-slate-300 transition-all shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div
                      className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center`}
                    >
                      <Icon className={`h-6 w-6 ${color}`} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">
                      {title}
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {items.map((item, j) => (
                      <div
                        key={j}
                        className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100"
                      >
                        <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                        <span className="font-medium text-slate-700 text-sm">
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
}
