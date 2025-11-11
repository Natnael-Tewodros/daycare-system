interface Child {
  id: number;
  fullName: string;
  dateOfBirth: Date;
  gender: string;
  organization?: { name: string };
  room?: { name: string };
  caregiver?: { fullName: string };
}

interface Attendance {
  id: number;
  status: string;
  checkInTime: Date | null;
  checkOutTime: Date | null;
  createdAt: Date;
}

interface DailyObservation {
  id: number;
  observationDate: Date;
  activities: string[];
  engagementLevel?: string | null;
  skillNotes?: string | null;
  mood?: string | null;
  cooperation?: string | null;
  socialNotes?: string | null;
  healthStatus?: string | null;
  hygieneNotes?: string | null;
  energyLevel?: string | null;
  eatingHabits?: string | null;
  breakfastStatus?: string | null;
  lunchStatus?: string | null;
  snackStatus?: string | null;
  napStartTime?: Date | null;
  napDuration?: number | null;
  sleepQuality?: string | null;
  teacherNotes?: string | null;
}

interface ReportData {
  child: Child;
  attendances: Attendance[];
  observations: DailyObservation[];
  weekStart: Date;
  weekEnd: Date;
  periodLabel?: 'Daily' | 'Weekly' | 'Monthly';
}

export function generateWeeklyReport(data: ReportData): string {
  const { child, attendances, observations, weekStart, weekEnd, periodLabel } = data;
  const label = periodLabel || 'Weekly';
  
  // Analyze activities
  const allActivities = observations.flatMap(o => o.activities || []);
  const uniqueActivities = [...new Set(allActivities)];
  const engagementLevels = observations.map(o => o.engagementLevel).filter(Boolean);
  const avgEngagement = engagementLevels.length > 0
    ? engagementLevels.reduce((acc, level) => {
        const score = level === 'high' ? 3 : level === 'medium' ? 2 : 1;
        return acc + score;
      }, 0) / engagementLevels.length
    : 0;
  const engagementText = avgEngagement >= 2.5 ? 'high' : avgEngagement >= 1.5 ? 'medium' : 'low';

  // Analyze behavior
  const moods = observations.map(o => o.mood).filter(Boolean);
  const cooperations = observations.map(o => o.cooperation).filter(Boolean);
  const socialNotes = observations.map(o => o.socialNotes).filter(Boolean);

  // Analyze health
  const healthStatuses = observations.map(o => o.healthStatus).filter(Boolean);
  const energyLevels = observations.map(o => o.energyLevel).filter(Boolean);
  const eatingHabits = observations.map(o => o.eatingHabits).filter(Boolean);

  // Analyze meals
  const breakfastCount = observations.filter(o => o.breakfastStatus === 'eaten').length;
  const lunchCount = observations.filter(o => o.lunchStatus === 'eaten').length;
  const snackCount = observations.filter(o => o.snackStatus === 'eaten').length;
  const skippedMeals = observations.filter(o => 
    o.breakfastStatus === 'skipped' || o.lunchStatus === 'skipped' || o.snackStatus === 'skipped'
  ).length;

  // Analyze sleep
  const napDurations = observations.map(o => o.napDuration).filter((d): d is number => d !== null && d !== undefined);
  const avgNapDuration = napDurations.length > 0
    ? Math.round(napDurations.reduce((a, b) => a + b, 0) / napDurations.length)
    : 0;
  const sleepQualities = observations.map(o => o.sleepQuality).filter(Boolean);

  // Teacher notes
  const teacherNotesList = observations.map(o => o.teacherNotes).filter(Boolean);

  // Generate report sections
  const report = `
# ${label} Report for ${child.fullName}
**${label === 'Daily' ? 'Date' : label === 'Monthly' ? 'Month of' : 'Week of'}:** ${weekStart.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}${label === 'Daily' ? '' : ` - ${weekEnd.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`}

---

## 1. General Overview

${generateGeneralOverview(child, observations.length, engagementText)}

---

## 2. Activities & Learning

**Activities Participated In:**
${uniqueActivities.length > 0 
  ? uniqueActivities.map(a => `• ${a}`).join('\n')
  : '• No specific activities recorded this week'
}

**Engagement Level:** ${engagementText.charAt(0).toUpperCase() + engagementText.slice(1)}

${observations.length > 0 
  ? `${child.fullName} ${engagementText === 'high' ? 'demonstrated enthusiastic participation' : engagementText === 'medium' ? 'showed good interest and participation' : 'participated in activities with' + (engagementText === 'low' ? 'some encouragement' : ' varying interest')} throughout the week.`
  : 'Activity data is being collected and will be available in future reports.'
}

${observations.some(o => o.skillNotes) 
  ? `\n**Skill Development Notes:**\n${observations.filter(o => o.skillNotes).map(o => `• ${o.skillNotes}`).join('\n')}`
  : ''
}

---

## 3. Behavior & Emotional Observation

${moods.length > 0 || cooperations.length > 0 || socialNotes.length > 0
  ? `**Mood Patterns:** ${getMoodSummary(moods)}\n\n**Cooperation:** ${getCooperationSummary(cooperations)}\n\n**Social Interactions:**\n${socialNotes.length > 0 ? socialNotes.map(n => `• ${n}`).join('\n') : '• Social interactions are developing well'}\n\n${child.fullName} ${getBehaviorSummary(moods, cooperations)} throughout the week.`
  : `Behavior observations are being tracked. ${child.fullName} continues to adapt to the daycare environment and interact with peers and caregivers.`
}

---

## 4. Health & Hygiene

${healthStatuses.length > 0 || energyLevels.length > 0
  ? `**Health Status:** ${getHealthSummary(healthStatuses)}\n\n**Energy Level:** ${getEnergySummary(energyLevels)}\n\n**Eating Habits:** ${getEatingSummary(eatingHabits)}\n\n${observations.some(o => o.hygieneNotes) 
    ? `**Hygiene Notes:**\n${observations.filter(o => o.hygieneNotes).map(o => `• ${o.hygieneNotes}`).join('\n')}\n\n`
    : ''
  }Overall, ${child.fullName} ${healthStatuses.every(s => s?.toLowerCase().includes('healthy')) ? 'maintained good health' : 'showed normal health patterns'} this week with ${energyLevels.length > 0 && energyLevels.every(e => e === 'high' || e === 'normal') ? 'steady' : 'varied'} energy levels.`
  : `Health and hygiene monitoring is ongoing. ${child.fullName} is learning and practicing good hygiene habits.`
}

---

## 5. Meal & Sleep Pattern

**Meal Consumption:**
• Breakfast: ${breakfastCount} of ${observations.length || 1} days
• Lunch: ${lunchCount} of ${observations.length || 1} days  
• Snacks: ${snackCount} of ${observations.length || 1} days
• Skipped Meals: ${skippedMeals} total

${breakfastCount + lunchCount + snackCount > (observations.length * 2)
  ? `${child.fullName} showed ${breakfastCount === observations.length && lunchCount === observations.length ? 'excellent' : 'good'} meal participation this week.`
  : skippedMeals > 0
  ? `We noticed some meals were ${skippedMeals === 1 ? 'skipped' : 'skipped'}. This is normal and we continue to encourage healthy eating habits.`
  : 'Meal patterns are being monitored and tracked.'
}

**Sleep Patterns:**
${avgNapDuration > 0
  ? `• Average Nap Duration: ${Math.floor(avgNapDuration / 60)} hours ${avgNapDuration % 60} minutes\n• Sleep Quality: ${getSleepQualitySummary(sleepQualities)}\n\n${avgNapDuration >= 60 ? `${child.fullName} maintained ${avgNapDuration >= 90 ? 'excellent' : 'good'} sleep routines with restful naps.` : 'Nap times are being established and improved.'}`
  : 'Sleep data is being collected. Regular nap schedules help support healthy development.'
}

---

## 6. Teacher's Notes

${teacherNotesList.length > 0
  ? teacherNotesList.map(note => `• ${note}`).join('\n\n')
  : `Overall, ${child.fullName} has been ${engagementText === 'high' ? 'an active and engaged' : 'a wonderful'} participant this week. We appreciate the opportunity to care for and support ${child.gender === 'MALE' ? 'his' : child.gender === 'FEMALE' ? 'her' : 'their'} development.`
}

---

## 7. AI Summary & Suggestions

${generateAISummary(child, {
  engagementText,
  observations: observations.length,
  avgNapDuration,
  skippedMeals,
  moods,
  cooperations,
  healthStatuses,
  energyLevels
})}

---

*Report generated on ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}*
*This report is based on recorded observations for the specified period.*
  `.trim();

  return report;
}

function generateGeneralOverview(child: Child, observationCount: number, engagement: string): string {
  const age = Math.floor((new Date().getTime() - new Date(child.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  
  return `This week has been a ${engagement === 'high' ? 'wonderful and productive' : engagement === 'medium' ? 'good' : 'meaningful'} week for ${child.fullName}${age ? ` (${age} ${age === 1 ? 'year' : 'years'})` : ''}. ${observationCount > 0
    ? `${child.gender === 'MALE' ? 'He' : child.gender === 'FEMALE' ? 'She' : 'They'} showed ${engagement === 'high' ? 'excellent' : engagement === 'medium' ? 'good' : 'steady'} engagement and participated actively in activities.`
    : `We're continuing to observe and support ${child.gender === 'MALE' ? 'his' : child.gender === 'FEMALE' ? 'her' : 'their'} development and growth.`
  } ${observationCount > 0 
    ? `Our team has documented ${observationCount} day${observationCount > 1 ? 's' : ''} of detailed observations.`
    : 'Daily observations help us understand and support each child\'s unique needs and interests.'
  }`;
}

function getMoodSummary(moods: (string | null | undefined)[]): string {
  if (moods.length === 0) return 'Mood patterns are being observed';
  
  const moodCounts: Record<string, number> = {};
  moods.forEach(m => {
    if (m) {
      const key = m.toLowerCase();
      moodCounts[key] = (moodCounts[key] || 0) + 1;
    }
  });
  
  const mostCommon = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];
  if (mostCommon) {
    return `Primarily ${mostCommon[0]} (${mostCommon[1]} observation${mostCommon[1] > 1 ? 's' : ''})`;
  }
  return 'Varied moods observed throughout the week';
}

function getCooperationSummary(cooperations: (string | null | undefined)[]): string {
  if (cooperations.length === 0) return 'Cooperation is developing well';
  
  const coopCounts: Record<string, number> = {};
  cooperations.forEach(c => {
    if (c) {
      const key = c.toLowerCase().replace('_', ' ');
      coopCounts[key] = (coopCounts[key] || 0) + 1;
    }
  });
  
  const mostCommon = Object.entries(coopCounts).sort((a, b) => b[1] - a[1])[0];
  if (mostCommon) {
    const level = mostCommon[0] === 'excellent' ? 'excellent' : mostCommon[0].includes('good') ? 'good' : 'developing';
    return `${level.charAt(0).toUpperCase() + level.slice(1)} (${mostCommon[1]} observation${mostCommon[1] > 1 ? 's' : ''})`;
  }
  return 'Good cooperation with caregivers and peers';
}

function getBehaviorSummary(moods: (string | null | undefined)[], cooperations: (string | null | undefined)[]): string {
  const positiveMoods = moods.filter(m => m && ['happy', 'calm', 'energetic', 'cheerful'].some(p => m.toLowerCase().includes(p)));
  const goodCooperation = cooperations.filter(c => c && ['excellent', 'good'].some(g => c.toLowerCase().includes(g)));
  
  if (positiveMoods.length > moods.length / 2 && goodCooperation.length > cooperations.length / 2) {
    return 'demonstrated positive behavior and excellent social skills';
  } else if (positiveMoods.length > 0 || goodCooperation.length > 0) {
    return 'showed positive interactions and continued to develop social skills';
  }
  return 'is learning and growing in social situations';
}

function getHealthSummary(healthStatuses: (string | null | undefined)[]): string {
  if (healthStatuses.length === 0) return 'Health monitoring ongoing';
  
  const healthy = healthStatuses.filter(h => h && h.toLowerCase().includes('healthy'));
  if (healthy.length === healthStatuses.length) {
    return 'Good health maintained throughout the week';
  } else if (healthy.length > healthStatuses.length / 2) {
    return 'Generally healthy with normal variations';
  }
  return 'Health status monitored and supported';
}

function getEnergySummary(energyLevels: (string | null | undefined)[]): string {
  if (energyLevels.length === 0) return 'Energy levels are being observed';
  
  const high = energyLevels.filter(e => e === 'high').length;
  const normal = energyLevels.filter(e => e === 'normal').length;
  const low = energyLevels.filter(e => e === 'low').length;
  
  if (high > normal && high > low) {
    return 'High energy levels observed';
  } else if (normal >= high && normal > low) {
    return 'Steady, normal energy levels';
  } else if (low > 0) {
    return 'Varied energy levels (some lower energy days noted)';
  }
  return 'Energy levels appropriate for activities';
}

function getEatingSummary(eatingHabits: (string | null | undefined)[]): string {
  if (eatingHabits.length === 0) return 'Eating habits are being observed';
  
  const good = eatingHabits.filter(e => e === 'good').length;
  const fair = eatingHabits.filter(e => e === 'fair').length;
  const poor = eatingHabits.filter(e => e === 'poor').length;
  
  if (good > fair && good > poor) {
    return 'Good eating habits maintained';
  } else if (fair >= good) {
    return 'Generally good eating with some variations';
  } else if (poor > 0) {
    return 'Eating habits are being encouraged and supported';
  }
  return 'Eating patterns are developing well';
}

function getSleepQualitySummary(sleepQualities: (string | null | undefined)[]): string {
  if (sleepQualities.length === 0) return 'Sleep quality is being monitored';
  
  const restful = sleepQualities.filter(s => s === 'restful').length;
  const light = sleepQualities.filter(s => s === 'light').length;
  const troubled = sleepQualities.filter(s => s === 'troubled').length;
  
  if (restful > light && restful > troubled) {
    return 'Mostly restful sleep';
  } else if (light >= restful) {
    return 'Generally good sleep with some light sleep periods';
  } else if (troubled > 0) {
    return 'Sleep patterns are being supported and improved';
  }
  return 'Sleep quality is appropriate';
}

function generateAISummary(
  child: Child,
  metrics: {
    engagementText: string;
    observations: number;
    avgNapDuration: number;
    skippedMeals: number;
    moods: (string | null | undefined)[];
    cooperations: (string | null | undefined)[];
    healthStatuses: (string | null | undefined)[];
    energyLevels: (string | null | undefined)[];
  }
): string {
  const { engagementText, observations, avgNapDuration, skippedMeals } = metrics;
  
  let summary = `${child.fullName} has had ${engagementText === 'high' ? 'an excellent' : engagementText === 'medium' ? 'a productive' : 'a meaningful'} week at daycare. `;
  
  // Engagement feedback
  if (engagementText === 'high') {
    summary += `${child.gender === 'MALE' ? 'His' : child.gender === 'FEMALE' ? 'Her' : 'Their'} high level of engagement in activities demonstrates ${child.gender === 'MALE' ? 'his' : child.gender === 'FEMALE' ? 'her' : 'their'} curiosity and eagerness to learn. `;
  } else if (engagementText === 'medium') {
    summary += `We're pleased to see ${child.gender === 'MALE' ? 'him' : child.gender === 'FEMALE' ? 'her' : 'them'} actively participating in activities with growing confidence. `;
  }
  
  // Suggestions
  summary += `\n\n**Suggestions for Parents:**\n\n`;
  
  const suggestions: string[] = [];
  
  if (engagementText === 'low' && observations > 0) {
    suggestions.push(`• At home, try engaging ${child.fullName} in similar activities to those at daycare to build interest and familiarity.`);
  }
  
  if (skippedMeals > observations / 2) {
    suggestions.push(`• Consider discussing meal preferences with our staff. We're happy to work together to ensure ${child.fullName} enjoys ${child.gender === 'MALE' ? 'his' : child.gender === 'FEMALE' ? 'her' : 'their'} meals.`);
  }
  
  if (avgNapDuration > 0 && avgNapDuration < 60) {
    suggestions.push(`• Maintaining a consistent sleep schedule at home can help support better nap times at daycare.`);
  }
  
  if (suggestions.length === 0) {
    suggestions.push(`• Continue the great work at home! ${child.fullName} is thriving in the daycare environment.`);
    suggestions.push(`• Regular communication with our staff helps us provide the best care. Feel free to share any concerns or updates.`);
    suggestions.push(`• Celebrate ${child.gender === 'MALE' ? 'his' : child.gender === 'FEMALE' ? 'her' : 'their'} achievements and continue to encourage ${child.gender === 'MALE' ? 'his' : child.gender === 'FEMALE' ? 'her' : 'their'} curiosity and learning at home.`);
  } else {
    suggestions.push(`• We appreciate your partnership in supporting ${child.fullName}'s growth and development.`);
  }
  
  summary += suggestions.join('\n');
  
  summary += `\n\nWe look forward to another wonderful week with ${child.fullName}!`;
  
  return summary;
}

