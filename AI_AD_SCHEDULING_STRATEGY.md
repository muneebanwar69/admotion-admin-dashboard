# AI Ad Scheduling Strategy - AdMotion

## What Is This?

This document explains how ads will be automatically scheduled and shown on vehicles after they are uploaded and vehicles are registered. Think of it like a smart TV channel manager that decides which ad plays where, when, and why.

---

## The 6 Types of Ad Scheduling

### Type 1: Time-Based Scheduling

**What it does:** Shows different ads at different times of the day.

**How it works:**
- Divide the day into time slots (morning, afternoon, evening, night)
- Each time slot can have different ads
- Example: A breakfast restaurant ad plays from 6 AM to 11 AM, a clothing store ad plays from 11 AM to 5 PM

**Time Slots:**
| Slot | Time | Best For |
|------|------|----------|
| Early Morning | 5 AM - 8 AM | Breakfast, gym, commute ads |
| Morning | 8 AM - 12 PM | Office, retail, service ads |
| Afternoon | 12 PM - 5 PM | Food delivery, shopping, entertainment |
| Evening | 5 PM - 9 PM | Restaurants, events, nightlife |
| Night | 9 PM - 5 AM | Late-night food, 24-hour services |

**Why this matters:** A pizza ad at 7 AM makes no sense. Showing the right ad at the right time gets more attention.

---

### Type 2: Location-Based Scheduling (City + Area Level)

**What it does:** Shows ads based on WHERE the vehicle is driving right now.

**How it works at City Level:**
- Each ad can be assigned to one or more cities (Islamabad, Lahore, Karachi, etc.)
- When a vehicle is in Islamabad, it only shows ads meant for Islamabad
- An ad for a Lahore restaurant will NOT play on a vehicle in Karachi

**How it works at Area Level (within a city):**
- Each city is divided into areas/zones
- Example for Islamabad: F-6, F-7, F-8, Blue Area, I-8, G-9, etc.
- A shop in F-7 Markaz can target ONLY vehicles driving through F-6, F-7, and F-8
- The system uses GPS coordinates to detect which area the vehicle is in

**Area Detection:**
- The vehicle already sends its GPS location every 30 seconds
- The system checks: "Which area does this GPS point fall into?"
- If the vehicle enters a targeted area, the relevant ad starts playing
- If the vehicle leaves that area, the ad stops

**Example:**
- Ad: "Grand Opening - New Cafe in Blue Area"
- Targeted Areas: Blue Area, F-6, F-7, G-6
- Result: Only vehicles driving through these areas show this ad

---

### Type 3: Weather-Based Scheduling

**What it does:** Changes ads based on current weather conditions.

**How it works:**
- The system checks weather data for the vehicle's current city
- Different ads play for different weather conditions

**Weather Conditions and Ad Examples:**
| Weather | What Ads to Show | Why |
|---------|-----------------|-----|
| Sunny/Hot | Cold drinks, ice cream, AC services, sunglasses | People want cool things |
| Rainy | Umbrellas, indoor activities, food delivery, waterproof items | People stay indoors or need rain gear |
| Cold/Winter | Hot beverages, warm clothing, heaters, soup restaurants | People want warm things |
| Cloudy | General ads, events, shopping | Neutral weather, show general content |
| Smoggy/Hazy | Air purifiers, masks, health products, indoor gyms | Health-related products sell more |

**How weather data is fetched:**
- Use a free weather API (like OpenWeatherMap)
- Check weather every 30 minutes for each city
- Update ad assignments when weather changes significantly

---

### Type 4: Fair Visibility (Equal Exposure for All Ads)

**What it does:** Makes sure every ad gets a fair share of screen time. No ad gets ignored.

**The Problem Without This:**
- Imagine 10 ads are uploaded but only 3 vehicles are running
- Without fairness, the same 3-4 ads might play all day
- The remaining 6-7 ads might barely get shown
- Advertisers who paid money see no results = unhappy customers

**How Fair Visibility Works:**

**Step 1 - Track Impressions:**
- Every time an ad plays on a screen for 15 seconds = 1 impression
- The system counts impressions for every ad

**Step 2 - Priority Queue:**
- Ads with FEWER impressions get HIGHER priority
- Ads with MORE impressions get LOWER priority
- This naturally balances out over time

**Step 3 - Budget-Weighted Fairness:**
- An ad with a 50,000 PKR budget should get MORE screen time than a 10,000 PKR ad
- The system calculates: target impressions = budget / cost per impression
- Ads below their target get boosted, ads above their target slow down

**Step 4 - Daily Reset Check:**
- At the end of each day, the system reviews: did every ad get its fair share?
- If an ad was under-shown, it gets priority the next day

**Example:**
- Ad A (Budget: 50,000) - Target: 5,000 impressions/day - Currently at 3,000 = NEEDS MORE
- Ad B (Budget: 20,000) - Target: 2,000 impressions/day - Currently at 2,500 = SLOW DOWN
- Ad C (Budget: 50,000) - Target: 5,000 impressions/day - Currently at 1,000 = HIGH PRIORITY

---

### Type 5: Manual Campaign Mode (Special/Government/Event Ads)

**What it does:** Lets admins manually assign specific ads to specific vehicles. These vehicles show ONLY those ads 24/7 until the admin disables the campaign. The AI scheduler does NOT touch these vehicles.

**When to use this:**
- Government announcements (elections, census, public health)
- National holidays (14th August, 23rd March)
- Emergency alerts (flood warnings, COVID updates)
- Special sponsorship deals (a company pays for dedicated vehicle branding)
- Event promotions (PSL matches, concerts, festivals)
- Political campaigns (during election season)

**How it works:**
1. Admin creates a "Manual Campaign"
2. Admin selects which ads to show
3. Admin selects which vehicles to assign
4. Those vehicles IMMEDIATELY start showing only those ads
5. The AI scheduler skips these vehicles completely
6. Ads play 24/7 in rotation on selected vehicles
7. Campaign stays active until admin manually disables it

**Key Rules:**
- Manual campaigns ALWAYS override AI scheduling
- A vehicle can only be in ONE manual campaign at a time
- When a manual campaign ends, the vehicle goes back to AI scheduling automatically
- Manual campaign vehicles are clearly marked in the dashboard (with a badge/tag)
- Activity logs record when manual campaigns start and end

**Example:**
- Campaign: "14th August Independence Day"
- Ads: Pakistan flag animation, government message, national anthem promo
- Vehicles: 20 selected vehicles in Islamabad
- Duration: August 10-15
- Result: Those 20 vehicles show ONLY these 3 ads, rotating, for 5 days straight

---

### Type 6: AI Smart Scheduler (Combines Everything)

**What it does:** This is the brain that combines ALL the above types together and makes the final decision on which ad plays where.

**Decision Process (in simple steps):**

```
Step 1: Remove all vehicles in Manual Campaigns (don't touch them)
            |
Step 2: For each remaining vehicle, check its GPS location
            |
Step 3: Find which city and area the vehicle is in
            |
Step 4: Filter ads that target this city/area
            |
Step 5: Check current time → filter ads for this time slot
            |
Step 6: Check current weather → boost weather-relevant ads
            |
Step 7: From remaining ads, pick the ones with LOWEST impressions
            (fair visibility)
            |
Step 8: Assign top 3-5 ads to this vehicle
            |
Step 9: Vehicle rotates these ads every 15 seconds
            |
Step 10: Every 30 minutes, re-run this process
            (because vehicle may have moved to a new area)
```

**How often does the AI run?**
- Full re-calculation: Every 30 minutes
- Quick location check: Every 5 minutes (if vehicle moved to new area, swap ads)
- Weather update: Every 30 minutes
- Impression count update: Real-time (every ad play is counted)

---

## How All 6 Types Work Together

Here is a real-world scenario to show how everything connects:

**Scenario:** It is 2 PM on a rainy Tuesday in Islamabad. A vehicle is driving through Blue Area.

1. **Manual Campaign Check:** Is this vehicle in a manual campaign? NO → continue with AI
2. **Location Check:** Vehicle is in Islamabad → Blue Area
3. **Time Check:** It is 2 PM → Afternoon slot
4. **Weather Check:** It is rainy
5. **Available Ads Filter:**
   - Start with ALL active ads
   - Filter: Only ads targeting Islamabad ✓
   - Filter: Only ads targeting Blue Area (or city-wide) ✓
   - Filter: Only ads scheduled for afternoon ✓
   - Boost: Ads tagged for rainy weather get priority ✓
6. **Fair Visibility Sort:** From filtered ads, sort by who has been shown LEAST
7. **Final Selection:** Pick top 3-5 ads
8. **Result:** Vehicle shows:
   - Foodpanda delivery ad (rainy weather boost + low impressions)
   - Blue Area coffee shop ad (location match + afternoon slot)
   - Umbrella sale ad (weather match + fair visibility boost)

---

## Priority Order (What Wins When There Is a Conflict)

| Priority | Type | Reason |
|----------|------|--------|
| 1 (Highest) | Manual Campaign | Admin has explicitly assigned these ads |
| 2 | Location (Area) | Most relevant to people who can actually see the vehicle |
| 3 | Time-Based | Shows contextually appropriate ads |
| 4 | Weather-Based | Bonus relevance based on conditions |
| 5 | Fair Visibility | Ensures all advertisers get value |

---

## What Happens in Edge Cases

**Q: What if there are no ads for a specific area?**
A: The system falls back to city-level ads. If no city ads exist, it shows national/general ads.

**Q: What if a vehicle goes offline?**
A: The vehicle keeps playing its last assigned ads from cache. When it comes back online, ads update automatically.

**Q: What if an ad's budget runs out?**
A: The ad is immediately removed from rotation. Other ads fill the gap.

**Q: What if an ad expires (end date passed)?**
A: The ad is automatically removed. The system picks the next best ad.

**Q: What if all ads are in manual campaigns and none are left for AI?**
A: The AI shows a default AdMotion branded placeholder until new ads are available.

**Q: What if a vehicle moves between two cities?**
A: As soon as GPS detects the new city, ads update within 5 minutes to match the new location.

**Q: What if weather changes suddenly?**
A: Weather is checked every 30 minutes. Ads adjust on the next scheduling cycle.

---

## Summary Table

| Feature | What It Does | Updates How Often |
|---------|-------------|-------------------|
| Time-Based | Different ads for different times of day | Every time slot change |
| Location (City) | Ads specific to a city | Every 5 minutes |
| Location (Area) | Ads specific to a neighborhood | Every 5 minutes |
| Weather-Based | Ads matching current weather | Every 30 minutes |
| Fair Visibility | Equal screen time for all ads | Real-time tracking |
| Manual Campaign | Fixed ads on selected vehicles 24/7 | Only when admin changes it |
| AI Smart Scheduler | Combines all above into final decision | Every 30 minutes (full), 5 min (location) |

---

## Next Steps

Once you review and approve this strategy, we will implement each type step by step in the backend (FastAPI) and connect it to both the admin dashboard and the vehicle app.
