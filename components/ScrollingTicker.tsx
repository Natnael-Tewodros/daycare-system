"use client";

import React from "react";

const tickerMessages = [
  "🎨 Art Week starts Monday! Little Picassos, get ready to create masterpieces! 🎨",
  "🍎 Healthy snack time! Fresh fruits and veggies make us strong and happy! 🍎",
  "📚 Story time magic! Join us for amazing adventures in our reading corner! 📚",
  "🎵 Music Monday is here! Let's sing, dance, and make beautiful memories! 🎵",
  "🌱 Garden project begins! Watch our tiny seeds grow into amazing plants! 🌱",
  "🎉 Parent-Teacher meetings this Friday! Let's celebrate your child's amazing progress! 🎉"
];

export default function ScrollingTicker() {
  return (
    <div className="bg-gradient-to-r from-blue-500 to-orange-500 text-white py-3 overflow-hidden relative">
      <div className="animate-scroll-left whitespace-nowrap">
        <div className="inline-block">
          {tickerMessages.map((message, index) => (
            <span key={index} className="mx-8 text-lg font-medium">
              {message}
            </span>
          ))}
          {/* Duplicate for seamless loop */}
          {tickerMessages.map((message, index) => (
            <span key={`duplicate-${index}`} className="mx-8 text-lg font-medium">
              {message}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
