"use client";
// EPHEMERAL: Logo Creator, a dev-only floating panel that swaps the live logo mark, wordmark font, body font and primary color. Delete this folder once the brand is chosen.

import { useEffect, useMemo, useRef, useState } from "react";
import { Bookmark, BookmarkCheck, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Crown, Redo2, Search, Shuffle, Undo2, X } from "lucide-react";
import { LAB_ICONS, PICKS, type LabIcon } from "./icons";
import { CATALOG } from "./catalog";
import { fetchIcon, resolveIcon, useIconVersion } from "./iconCache";
import { BRAND, CASING, HOVERS, ensureLabStyles, pathProps, setLab, svgProps, useLab, type Casing, type Tracking } from "./store";

type Group = "common" | "geometric" | "retro" | "futuristic" | "space" | "script" | "display" | "serif" | "condensed" | "mono";
type Tab = "saved" | "icon" | "font" | "body" | "color" | "hover";
type Author = "picks" | "lorc" | "delapouite" | "skoll" | "sbed" | "viscious-speed" | "all";
const AUTHORS: Author[] = ["picks", "lorc", "delapouite", "skoll", "sbed", "viscious-speed", "all"];
const GROUPS: Group[] = ["common", "geometric", "retro", "futuristic", "space", "script", "display", "serif", "condensed", "mono"];

import { Space_Grotesk } from "next/font/google";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"] });

// Candidate fonts load at runtime from Google Fonts, one stylesheet per family
// the first time it is shown, never at build: 583 next/font loaders fetched all
// at once tripped Google's rate limit, and since Next 16.3 a font that fails to
// fetch is a build error that takes the whole dev server down. `axis` is the
// weight axis the family offers (from next's font data), so every weight the
// stepper reaches is real. Baking still writes a proper next/font loader for
// the one font that wins.
type Font = { name: string; family: string | null; axis?: string; group: Group };
const FONTS: Font[] = [
  { name: "Current (Orbitron)", family: null, group: "futuristic" },
  { name: "Current (Montserrat)", family: null, group: "common" },
  { name: "Inter", family: "'Inter'", axis: "wght@100..900", group: "common" },
  { name: "Roboto", family: "'Roboto'", axis: "wght@100..900", group: "common" },
  { name: "Open Sans", family: "'Open Sans'", axis: "wght@300..800", group: "common" },
  { name: "Lato", family: "'Lato'", axis: "wght@100;300;400;700;900", group: "common" },
  { name: "Montserrat", family: "'Montserrat'", axis: "wght@100..900", group: "common" },
  { name: "Poppins", family: "'Poppins'", axis: "wght@100;200;300;400;500;600;700;800;900", group: "common" },
  { name: "Nunito", family: "'Nunito'", axis: "wght@200..1000", group: "common" },
  { name: "Nunito Sans", family: "'Nunito Sans'", axis: "wght@200..1000", group: "common" },
  { name: "Raleway", family: "'Raleway'", axis: "wght@100..900", group: "common" },
  { name: "Work Sans", family: "'Work Sans'", axis: "wght@100..900", group: "common" },
  { name: "DM Sans", family: "'DM Sans'", axis: "wght@100..1000", group: "common" },
  { name: "Rubik", family: "'Rubik'", axis: "wght@300..900", group: "common" },
  { name: "Karla", family: "'Karla'", axis: "wght@200..800", group: "common" },
  { name: "Mulish", family: "'Mulish'", axis: "wght@200..1000", group: "common" },
  { name: "Cabin", family: "'Cabin'", axis: "wght@400..700", group: "common" },
  { name: "Ubuntu", family: "'Ubuntu'", axis: "wght@300;400;500;700", group: "common" },
  { name: "Source Sans 3", family: "'Source Sans 3'", axis: "wght@200..900", group: "common" },
  { name: "Fira Sans", family: "'Fira Sans'", axis: "wght@100;200;300;400;500;600;700;800;900", group: "common" },
  { name: "PT Sans", family: "'PT Sans'", axis: "wght@400;700", group: "common" },
  { name: "Noto Sans", family: "'Noto Sans'", axis: "wght@100..900", group: "common" },
  { name: "Public Sans", family: "'Public Sans'", axis: "wght@100..900", group: "common" },
  { name: "IBM Plex Sans", family: "'IBM Plex Sans'", axis: "wght@100..700", group: "common" },
  { name: "Figtree", family: "'Figtree'", axis: "wght@300..900", group: "common" },
  { name: "Outfit", family: "'Outfit'", axis: "wght@100..900", group: "common" },
  { name: "Sora", family: "'Sora'", axis: "wght@100..800", group: "common" },
  { name: "Manrope", family: "'Manrope'", axis: "wght@200..800", group: "common" },
  { name: "Plus Jakarta Sans", family: "'Plus Jakarta Sans'", axis: "wght@200..800", group: "common" },
  { name: "Lexend", family: "'Lexend'", axis: "wght@100..900", group: "common" },
  { name: "Urbanist", family: "'Urbanist'", axis: "wght@100..900", group: "common" },
  { name: "Jost", family: "'Jost'", axis: "wght@100..900", group: "common" },
  { name: "Josefin Sans", family: "'Josefin Sans'", axis: "wght@100..700", group: "common" },
  { name: "Archivo", family: "'Archivo'", axis: "wght@100..900", group: "common" },
  { name: "Barlow", family: "'Barlow'", axis: "wght@100;200;300;400;500;600;700;800;900", group: "common" },
  { name: "Hind", family: "'Hind'", axis: "wght@300;400;500;600;700", group: "common" },
  { name: "Dosis", family: "'Dosis'", axis: "wght@200..800", group: "common" },
  { name: "Signika", family: "'Signika'", axis: "wght@300..700", group: "common" },
  { name: "Sen", family: "'Sen'", axis: "wght@400..800", group: "common" },
  { name: "Quicksand", family: "'Quicksand'", axis: "wght@300..700", group: "common" },
  { name: "Varela Round", family: "'Varela Round'", axis: "wght@400", group: "common" },
  { name: "Heebo", family: "'Heebo'", axis: "wght@100..900", group: "common" },
  { name: "Assistant", family: "'Assistant'", axis: "wght@200..800", group: "common" },
  { name: "Titillium Web", family: "'Titillium Web'", axis: "wght@200;300;400;600;700;900", group: "common" },
  { name: "Exo 2", family: "'Exo 2'", axis: "wght@100..900", group: "common" },
  { name: "Kanit", family: "'Kanit'", axis: "wght@100;200;300;400;500;600;700;800;900", group: "common" },
  { name: "Prompt", family: "'Prompt'", axis: "wght@100;200;300;400;500;600;700;800;900", group: "common" },
  { name: "Red Hat Display", family: "'Red Hat Display'", axis: "wght@300..900", group: "common" },
  { name: "Red Hat Text", family: "'Red Hat Text'", axis: "wght@300..700", group: "common" },
  { name: "Onest", family: "'Onest'", axis: "wght@100..900", group: "common" },
  { name: "Instrument Sans", family: "'Instrument Sans'", axis: "wght@400..700", group: "common" },
  { name: "Geist", family: "'Geist'", axis: "wght@100..900", group: "common" },
  { name: "Syne", family: "'Syne'", axis: "wght@400..800", group: "geometric" },
  { name: "Unbounded", family: "'Unbounded'", axis: "wght@200..900", group: "geometric" },
  { name: "Bricolage Grotesque", family: "'Bricolage Grotesque'", axis: "wght@200..800", group: "geometric" },
  { name: "Familjen Grotesk", family: "'Familjen Grotesk'", axis: "wght@400..700", group: "geometric" },
  { name: "Gabarito", family: "'Gabarito'", axis: "wght@400..900", group: "geometric" },
  { name: "Funnel Display", family: "'Funnel Display'", axis: "wght@300..800", group: "geometric" },
  { name: "Host Grotesk", family: "'Host Grotesk'", axis: "wght@300..800", group: "geometric" },
  { name: "Schibsted Grotesk", family: "'Schibsted Grotesk'", axis: "wght@400..900", group: "geometric" },
  { name: "Golos Text", family: "'Golos Text'", axis: "wght@400..900", group: "geometric" },
  { name: "Hanken Grotesk", family: "'Hanken Grotesk'", axis: "wght@100..900", group: "geometric" },
  { name: "Albert Sans", family: "'Albert Sans'", axis: "wght@100..900", group: "geometric" },
  { name: "Epilogue", family: "'Epilogue'", axis: "wght@100..900", group: "geometric" },
  { name: "Kumbh Sans", family: "'Kumbh Sans'", axis: "wght@100..900", group: "geometric" },
  { name: "Sofia Sans", family: "'Sofia Sans'", axis: "wght@1..1000", group: "geometric" },
  { name: "Wix Madefor Display", family: "'Wix Madefor Display'", axis: "wght@400..800", group: "geometric" },
  { name: "Rethink Sans", family: "'Rethink Sans'", axis: "wght@400..800", group: "geometric" },
  { name: "Afacad", family: "'Afacad'", axis: "wght@400..700", group: "geometric" },
  { name: "Reddit Sans", family: "'Reddit Sans'", axis: "wght@200..900", group: "geometric" },
  { name: "Parkinsans", family: "'Parkinsans'", axis: "wght@300..800", group: "geometric" },
  { name: "Darker Grotesque", family: "'Darker Grotesque'", axis: "wght@300..900", group: "geometric" },
  { name: "Space Grotesk", family: "'Space Grotesk'", axis: "wght@300..700", group: "geometric" },
  { name: "League Spartan", family: "'League Spartan'", axis: "wght@100..900", group: "geometric" },
  { name: "Questrial", family: "'Questrial'", axis: "wght@400", group: "geometric" },
  { name: "Montserrat Alternates", family: "'Montserrat Alternates'", axis: "wght@100;200;300;400;500;600;700;800;900", group: "geometric" },
  { name: "Comfortaa", family: "'Comfortaa'", axis: "wght@300..700", group: "geometric" },
  { name: "Fredoka", family: "'Fredoka'", axis: "wght@300..700", group: "geometric" },
  { name: "Baloo 2", family: "'Baloo 2'", axis: "wght@400..800", group: "geometric" },
  { name: "Lexend Zetta", family: "'Lexend Zetta'", axis: "wght@100..900", group: "geometric" },
  { name: "Lexend Mega", family: "'Lexend Mega'", axis: "wght@100..900", group: "geometric" },
  { name: "Lexend Exa", family: "'Lexend Exa'", axis: "wght@100..900", group: "geometric" },
  { name: "Lexend Giga", family: "'Lexend Giga'", axis: "wght@100..900", group: "geometric" },
  { name: "Tilt Warp", family: "'Tilt Warp'", axis: "wght@400", group: "geometric" },
  { name: "Tilt Neon", family: "'Tilt Neon'", axis: "wght@400", group: "geometric" },
  { name: "Anta", family: "'Anta'", axis: "wght@400", group: "geometric" },
  { name: "Bruno Ace", family: "'Bruno Ace'", axis: "wght@400", group: "geometric" },
  { name: "Bruno Ace SC", family: "'Bruno Ace SC'", axis: "wght@400", group: "geometric" },
  { name: "Tomorrow", family: "'Tomorrow'", axis: "wght@100;200;300;400;500;600;700;800;900", group: "geometric" },
  { name: "Tektur", family: "'Tektur'", axis: "wght@400..900", group: "geometric" },
  { name: "Kdam Thmor Pro", family: "'Kdam Thmor Pro'", axis: "wght@400", group: "geometric" },
  { name: "Genos", family: "'Genos'", axis: "wght@100..900", group: "geometric" },
  { name: "Trispace", family: "'Trispace'", axis: "wght@100..800", group: "geometric" },
  { name: "Smooch Sans", family: "'Smooch Sans'", axis: "wght@100..900", group: "geometric" },
  { name: "Mohave", family: "'Mohave'", axis: "wght@300..700", group: "geometric" },
  { name: "Pathway Extreme", family: "'Pathway Extreme'", axis: "wght@100..900", group: "geometric" },
  { name: "Spinnaker", family: "'Spinnaker'", axis: "wght@400", group: "geometric" },
  { name: "Telex", family: "'Telex'", axis: "wght@400", group: "geometric" },
  { name: "Voltaire", family: "'Voltaire'", axis: "wght@400", group: "geometric" },
  { name: "Yantramanav", family: "'Yantramanav'", axis: "wght@100;300;400;500;700;900", group: "geometric" },
  { name: "M PLUS Rounded 1c", family: "'M PLUS Rounded 1c'", axis: "wght@100;300;400;500;700;800;900", group: "geometric" },
  { name: "Zen Kaku Gothic New", family: "'Zen Kaku Gothic New'", axis: "wght@300;400;500;700;900", group: "geometric" },
  { name: "Dela Gothic One", family: "'Dela Gothic One'", axis: "wght@400", group: "geometric" },
  { name: "Righteous", family: "'Righteous'", axis: "wght@400", group: "retro" },
  { name: "Audiowide", family: "'Audiowide'", axis: "wght@400", group: "retro" },
  { name: "Days One", family: "'Days One'", axis: "wght@400", group: "retro" },
  { name: "Monomaniac One", family: "'Monomaniac One'", axis: "wght@400", group: "retro" },
  { name: "Concert One", family: "'Concert One'", axis: "wght@400", group: "retro" },
  { name: "Lilita One", family: "'Lilita One'", axis: "wght@400", group: "retro" },
  { name: "Paytone One", family: "'Paytone One'", axis: "wght@400", group: "retro" },
  { name: "Bowlby One", family: "'Bowlby One'", axis: "wght@400", group: "retro" },
  { name: "Bowlby One SC", family: "'Bowlby One SC'", axis: "wght@400", group: "retro" },
  { name: "Racing Sans One", family: "'Racing Sans One'", axis: "wght@400", group: "retro" },
  { name: "Krona One", family: "'Krona One'", axis: "wght@400", group: "retro" },
  { name: "Goldman", family: "'Goldman'", axis: "wght@400;700", group: "retro" },
  { name: "Iceberg", family: "'Iceberg'", axis: "wght@400", group: "retro" },
  { name: "Turret Road", family: "'Turret Road'", axis: "wght@200;300;400;500;700;800", group: "retro" },
  { name: "Sarpanch", family: "'Sarpanch'", axis: "wght@400;500;600;700;800;900", group: "retro" },
  { name: "Fugaz One", family: "'Fugaz One'", axis: "wght@400", group: "retro" },
  { name: "Chango", family: "'Chango'", axis: "wght@400", group: "retro" },
  { name: "Contrail One", family: "'Contrail One'", axis: "wght@400", group: "retro" },
  { name: "Boogaloo", family: "'Boogaloo'", axis: "wght@400", group: "retro" },
  { name: "Sansita", family: "'Sansita'", axis: "wght@400;700;800;900", group: "retro" },
  { name: "Sniglet", family: "'Sniglet'", axis: "wght@400;800", group: "retro" },
  { name: "Shrikhand", family: "'Shrikhand'", axis: "wght@400", group: "retro" },
  { name: "Titan One", family: "'Titan One'", axis: "wght@400", group: "retro" },
  { name: "Rowdies", family: "'Rowdies'", axis: "wght@300;400;700", group: "retro" },
  { name: "Bagel Fat One", family: "'Bagel Fat One'", axis: "wght@400", group: "retro" },
  { name: "Gasoek One", family: "'Gasoek One'", axis: "wght@400", group: "retro" },
  { name: "Bangers", family: "'Bangers'", axis: "wght@400", group: "retro" },
  { name: "Luckiest Guy", family: "'Luckiest Guy'", axis: "wght@400", group: "retro" },
  { name: "Alfa Slab One", family: "'Alfa Slab One'", axis: "wght@400", group: "retro" },
  { name: "Ultra", family: "'Ultra'", axis: "wght@400", group: "retro" },
  { name: "Rammetto One", family: "'Rammetto One'", axis: "wght@400", group: "retro" },
  { name: "Rubik Mono One", family: "'Rubik Mono One'", axis: "wght@400", group: "retro" },
  { name: "Black Ops One", family: "'Black Ops One'", axis: "wght@400", group: "retro" },
  { name: "Bungee", family: "'Bungee'", axis: "wght@400", group: "retro" },
  { name: "Passion One", family: "'Passion One'", axis: "wght@400;700;900", group: "retro" },
  { name: "Squada One", family: "'Squada One'", axis: "wght@400", group: "retro" },
  { name: "Russo One", family: "'Russo One'", axis: "wght@400", group: "retro" },
  { name: "Poller One", family: "'Poller One'", axis: "wght@400", group: "retro" },
  { name: "Jockey One", family: "'Jockey One'", axis: "wght@400", group: "retro" },
  { name: "Marvel", family: "'Marvel'", axis: "wght@400;700", group: "retro" },
  { name: "Homenaje", family: "'Homenaje'", axis: "wght@400", group: "retro" },
  { name: "Geo", family: "'Geo'", axis: "wght@400", group: "retro" },
  { name: "Rationale", family: "'Rationale'", axis: "wght@400", group: "retro" },
  { name: "Strait", family: "'Strait'", axis: "wght@400", group: "retro" },
  { name: "Economica", family: "'Economica'", axis: "wght@400;700", group: "retro" },
  { name: "Share", family: "'Share'", axis: "wght@400;700", group: "retro" },
  { name: "Share Tech", family: "'Share Tech'", axis: "wght@400", group: "retro" },
  { name: "Limelight", family: "'Limelight'", axis: "wght@400", group: "retro" },
  { name: "Poiret One", family: "'Poiret One'", axis: "wght@400", group: "retro" },
  { name: "Abril Fatface", family: "'Abril Fatface'", axis: "wght@400", group: "retro" },
  { name: "Yeseva One", family: "'Yeseva One'", axis: "wght@400", group: "retro" },
  { name: "Lobster", family: "'Lobster'", axis: "wght@400", group: "retro" },
  { name: "Pacifico", family: "'Pacifico'", axis: "wght@400", group: "retro" },
  { name: "Kaushan Script", family: "'Kaushan Script'", axis: "wght@400", group: "retro" },
  { name: "Permanent Marker", family: "'Permanent Marker'", axis: "wght@400", group: "retro" },
  { name: "Protest Strike", family: "'Protest Strike'", axis: "wght@400", group: "retro" },
  { name: "Protest Riot", family: "'Protest Riot'", axis: "wght@400", group: "retro" },
  { name: "Chonburi", family: "'Chonburi'", axis: "wght@400", group: "retro" },
  { name: "Cherry Bomb One", family: "'Cherry Bomb One'", axis: "wght@400", group: "retro" },
  { name: "Mochiy Pop One", family: "'Mochiy Pop One'", axis: "wght@400", group: "retro" },
  { name: "Jaro", family: "'Jaro'", axis: "wght@400", group: "retro" },
  { name: "Climate Crisis", family: "'Climate Crisis'", axis: "wght@400", group: "retro" },
  { name: "Foldit", family: "'Foldit'", axis: "wght@100..900", group: "retro" },
  { name: "Faster One", family: "'Faster One'", axis: "wght@400", group: "retro" },
  { name: "Wallpoet", family: "'Wallpoet'", axis: "wght@400", group: "retro" },
  { name: "Syncopate", family: "'Syncopate'", axis: "wght@400;700", group: "retro" },
  { name: "Major Mono Display", family: "'Major Mono Display'", axis: "wght@400", group: "retro" },
  { name: "Bungee Shade", family: "'Bungee Shade'", axis: "wght@400", group: "retro" },
  { name: "Bungee Inline", family: "'Bungee Inline'", axis: "wght@400", group: "retro" },
  { name: "Monoton", family: "'Monoton'", axis: "wght@400", group: "retro" },
  { name: "Orbitron", family: "'Orbitron'", axis: "wght@400..900", group: "space" },
  { name: "Michroma", family: "'Michroma'", axis: "wght@400", group: "space" },
  { name: "Chakra Petch", family: "'Chakra Petch'", axis: "wght@300;400;500;600;700", group: "space" },
  { name: "Oxanium", family: "'Oxanium'", axis: "wght@200..800", group: "space" },
  { name: "Quantico", family: "'Quantico'", axis: "wght@400;700", group: "space" },
  { name: "Aldrich", family: "'Aldrich'", axis: "wght@400", group: "space" },
  { name: "Electrolize", family: "'Electrolize'", axis: "wght@400", group: "space" },
  { name: "Jura", family: "'Jura'", axis: "wght@300..700", group: "space" },
  { name: "Nova Square", family: "'Nova Square'", axis: "wght@400", group: "space" },
  { name: "Nova Flat", family: "'Nova Flat'", axis: "wght@400", group: "space" },
  { name: "Nova Round", family: "'Nova Round'", axis: "wght@400", group: "space" },
  { name: "Play", family: "'Play'", axis: "wght@400;700", group: "space" },
  { name: "Saira", family: "'Saira'", axis: "wght@100..900", group: "space" },
  { name: "Rajdhani", family: "'Rajdhani'", axis: "wght@300;400;500;600;700", group: "space" },
  { name: "Bai Jamjuree", family: "'Bai Jamjuree'", axis: "wght@200;300;400;500;600;700", group: "space" },
  { name: "Advent Pro", family: "'Advent Pro'", axis: "wght@100..900", group: "space" },
  { name: "Gruppo", family: "'Gruppo'", axis: "wght@400", group: "space" },
  { name: "Stick No Bills", family: "'Stick No Bills'", axis: "wght@200..800", group: "space" },
  { name: "Sono", family: "'Sono'", axis: "wght@200..800", group: "space" },
  { name: "Exo", family: "'Exo'", axis: "wght@100..900", group: "space" },
  { name: "Zen Dots", family: "'Zen Dots'", axis: "wght@400", group: "space" },
  { name: "Tourney", family: "'Tourney'", axis: "wght@100..900", group: "space" },
  { name: "Krub", family: "'Krub'", axis: "wght@200;300;400;500;600;700", group: "space" },
  { name: "Mitr", family: "'Mitr'", axis: "wght@200;300;400;500;600;700", group: "space" },
  { name: "Niramit", family: "'Niramit'", axis: "wght@200;300;400;500;600;700", group: "space" },
  { name: "Grandstander", family: "'Grandstander'", axis: "wght@100..900", group: "space" },
  { name: "Playfair Display", family: "'Playfair Display'", axis: "wght@400..900", group: "serif" },
  { name: "Merriweather", family: "'Merriweather'", axis: "wght@300..900", group: "serif" },
  { name: "Lora", family: "'Lora'", axis: "wght@400..700", group: "serif" },
  { name: "Roboto Slab", family: "'Roboto Slab'", axis: "wght@100..900", group: "serif" },
  { name: "Bitter", family: "'Bitter'", axis: "wght@100..900", group: "serif" },
  { name: "Zilla Slab", family: "'Zilla Slab'", axis: "wght@300;400;500;600;700", group: "serif" },
  { name: "Arvo", family: "'Arvo'", axis: "wght@400;700", group: "serif" },
  { name: "Libre Baskerville", family: "'Libre Baskerville'", axis: "wght@400..700", group: "serif" },
  { name: "DM Serif Display", family: "'DM Serif Display'", axis: "wght@400", group: "serif" },
  { name: "Fraunces", family: "'Fraunces'", axis: "wght@100..900", group: "serif" },
  { name: "Instrument Serif", family: "'Instrument Serif'", axis: "wght@400", group: "serif" },
  { name: "Young Serif", family: "'Young Serif'", axis: "wght@400", group: "serif" },
  { name: "Newsreader", family: "'Newsreader'", axis: "wght@200..800", group: "serif" },
  { name: "Spectral", family: "'Spectral'", axis: "wght@200;300;400;500;600;700;800", group: "serif" },
  { name: "Crimson Pro", family: "'Crimson Pro'", axis: "wght@200..900", group: "serif" },
  { name: "EB Garamond", family: "'EB Garamond'", axis: "wght@400..800", group: "serif" },
  { name: "Cardo", family: "'Cardo'", axis: "wght@400;700", group: "serif" },
  { name: "Alegreya", family: "'Alegreya'", axis: "wght@400..900", group: "serif" },
  { name: "Bodoni Moda", family: "'Bodoni Moda'", axis: "wght@400..900", group: "serif" },
  { name: "Italiana", family: "'Italiana'", axis: "wght@400", group: "serif" },
  { name: "Marcellus", family: "'Marcellus'", axis: "wght@400", group: "serif" },
  { name: "Forum", family: "'Forum'", axis: "wght@400", group: "serif" },
  { name: "Julius Sans One", family: "'Julius Sans One'", axis: "wght@400", group: "serif" },
  { name: "Cinzel", family: "'Cinzel'", axis: "wght@400..900", group: "serif" },
  { name: "Cinzel Decorative", family: "'Cinzel Decorative'", axis: "wght@400;700;900", group: "serif" },
  { name: "Cormorant Garamond", family: "'Cormorant Garamond'", axis: "wght@300..700", group: "serif" },
  { name: "Josefin Slab", family: "'Josefin Slab'", axis: "wght@100..700", group: "serif" },
  { name: "Noto Serif", family: "'Noto Serif'", axis: "wght@100..900", group: "serif" },
  { name: "Source Serif 4", family: "'Source Serif 4'", axis: "wght@200..900", group: "serif" },
  { name: "Domine", family: "'Domine'", axis: "wght@400..700", group: "serif" },
  { name: "Vollkorn", family: "'Vollkorn'", axis: "wght@400..900", group: "serif" },
  { name: "Prata", family: "'Prata'", axis: "wght@400", group: "serif" },
  { name: "Gloock", family: "'Gloock'", axis: "wght@400", group: "serif" },
  { name: "Bevan", family: "'Bevan'", axis: "wght@400", group: "serif" },
  { name: "Oswald", family: "'Oswald'", axis: "wght@200..700", group: "condensed" },
  { name: "Bebas Neue", family: "'Bebas Neue'", axis: "wght@400", group: "condensed" },
  { name: "Anton", family: "'Anton'", axis: "wght@400", group: "condensed" },
  { name: "Anton SC", family: "'Anton SC'", axis: "wght@400", group: "condensed" },
  { name: "Antonio", family: "'Antonio'", axis: "wght@100..700", group: "condensed" },
  { name: "Teko", family: "'Teko'", axis: "wght@300..700", group: "condensed" },
  { name: "Archivo Black", family: "'Archivo Black'", axis: "wght@400", group: "condensed" },
  { name: "Archivo Narrow", family: "'Archivo Narrow'", axis: "wght@400..700", group: "condensed" },
  { name: "Barlow Condensed", family: "'Barlow Condensed'", axis: "wght@100;200;300;400;500;600;700;800;900", group: "condensed" },
  { name: "Barlow Semi Condensed", family: "'Barlow Semi Condensed'", axis: "wght@100;200;300;400;500;600;700;800;900", group: "condensed" },
  { name: "Saira Condensed", family: "'Saira Condensed'", axis: "wght@100;200;300;400;500;600;700;800;900", group: "condensed" },
  { name: "Sofia Sans Condensed", family: "'Sofia Sans Condensed'", axis: "wght@1..1000", group: "condensed" },
  { name: "Fjalla One", family: "'Fjalla One'", axis: "wght@400", group: "condensed" },
  { name: "Pathway Gothic One", family: "'Pathway Gothic One'", axis: "wght@400", group: "condensed" },
  { name: "League Gothic", family: "'League Gothic'", axis: "wght@400", group: "condensed" },
  { name: "Roboto Condensed", family: "'Roboto Condensed'", axis: "wght@100..900", group: "condensed" },
  { name: "Fira Sans Condensed", family: "'Fira Sans Condensed'", axis: "wght@100;200;300;400;500;600;700;800;900", group: "condensed" },
  { name: "Ubuntu Condensed", family: "'Ubuntu Condensed'", axis: "wght@400", group: "condensed" },
  { name: "Encode Sans Condensed", family: "'Encode Sans Condensed'", axis: "wght@100;200;300;400;500;600;700;800;900", group: "condensed" },
  { name: "Yanone Kaffeesatz", family: "'Yanone Kaffeesatz'", axis: "wght@200..700", group: "condensed" },
  { name: "Khand", family: "'Khand'", axis: "wght@300;400;500;600;700", group: "condensed" },
  { name: "Pragati Narrow", family: "'Pragati Narrow'", axis: "wght@400;700", group: "condensed" },
  { name: "Six Caps", family: "'Six Caps'", axis: "wght@400", group: "condensed" },
  { name: "Staatliches", family: "'Staatliches'", axis: "wght@400", group: "condensed" },
  { name: "Bungee Hairline", family: "'Bungee Hairline'", axis: "wght@400", group: "condensed" },
  { name: "Space Mono", family: "'Space Mono'", axis: "wght@400;700", group: "mono" },
  { name: "JetBrains Mono", family: "'JetBrains Mono'", axis: "wght@100..800", group: "mono" },
  { name: "Geist Mono", family: "'Geist Mono'", axis: "wght@100..900", group: "mono" },
  { name: "Martian Mono", family: "'Martian Mono'", axis: "wght@100..800", group: "mono" },
  { name: "IBM Plex Mono", family: "'IBM Plex Mono'", axis: "wght@100;200;300;400;500;600;700", group: "mono" },
  { name: "Roboto Mono", family: "'Roboto Mono'", axis: "wght@100..700", group: "mono" },
  { name: "Fira Code", family: "'Fira Code'", axis: "wght@300..700", group: "mono" },
  { name: "Source Code Pro", family: "'Source Code Pro'", axis: "wght@200..900", group: "mono" },
  { name: "DM Mono", family: "'DM Mono'", axis: "wght@300;400;500", group: "mono" },
  { name: "Azeret Mono", family: "'Azeret Mono'", axis: "wght@100..900", group: "mono" },
  { name: "Sometype Mono", family: "'Sometype Mono'", axis: "wght@400..700", group: "mono" },
  { name: "Red Hat Mono", family: "'Red Hat Mono'", axis: "wght@300..700", group: "mono" },
  { name: "Chivo Mono", family: "'Chivo Mono'", axis: "wght@100..900", group: "mono" },
  { name: "Spline Sans Mono", family: "'Spline Sans Mono'", axis: "wght@300..700", group: "mono" },
  { name: "Nova Mono", family: "'Nova Mono'", axis: "wght@400", group: "mono" },
  { name: "Share Tech Mono", family: "'Share Tech Mono'", axis: "wght@400", group: "mono" },
  { name: "Xanh Mono", family: "'Xanh Mono'", axis: "wght@400", group: "mono" },
  { name: "Kode Mono", family: "'Kode Mono'", axis: "wght@400..700", group: "mono" },
  { name: "Ubuntu Mono", family: "'Ubuntu Mono'", axis: "wght@400;700", group: "mono" },
  { name: "Courier Prime", family: "'Courier Prime'", axis: "wght@400;700", group: "mono" },
  { name: "Inconsolata", family: "'Inconsolata'", axis: "wght@200..900", group: "mono" },
  { name: "Overpass Mono", family: "'Overpass Mono'", axis: "wght@300..700", group: "mono" },
  { name: "Cutive Mono", family: "'Cutive Mono'", axis: "wght@400", group: "mono" },
  { name: "Syne Mono", family: "'Syne Mono'", axis: "wght@400", group: "mono" },
  { name: "Fragment Mono", family: "'Fragment Mono'", axis: "wght@400", group: "mono" },
  { name: "B612 Mono", family: "'B612 Mono'", axis: "wght@400;700", group: "mono" },
  { name: "Unica One", family: "'Unica One'", axis: "wght@400", group: "futuristic" },
  { name: "Federo", family: "'Federo'", axis: "wght@400", group: "futuristic" },
  { name: "Megrim", family: "'Megrim'", axis: "wght@400", group: "futuristic" },
  { name: "Kenia", family: "'Kenia'", axis: "wght@400", group: "futuristic" },
  { name: "Revalia", family: "'Revalia'", axis: "wght@400", group: "futuristic" },
  { name: "Stalinist One", family: "'Stalinist One'", axis: "wght@400", group: "futuristic" },
  { name: "Bungee Outline", family: "'Bungee Outline'", axis: "wght@400", group: "futuristic" },
  { name: "Rubik Iso", family: "'Rubik Iso'", axis: "wght@400", group: "futuristic" },
  { name: "Rubik 80s Fade", family: "'Rubik 80s Fade'", axis: "wght@400", group: "futuristic" },
  { name: "Rubik Vinyl", family: "'Rubik Vinyl'", axis: "wght@400", group: "futuristic" },
  { name: "Rubik Moonrocks", family: "'Rubik Moonrocks'", axis: "wght@400", group: "futuristic" },
  { name: "Rubik Lines", family: "'Rubik Lines'", axis: "wght@400", group: "futuristic" },
  { name: "Rubik Glitch", family: "'Rubik Glitch'", axis: "wght@400", group: "futuristic" },
  { name: "Rubik Maze", family: "'Rubik Maze'", axis: "wght@400", group: "futuristic" },
  { name: "Saira Stencil One", family: "'Saira Stencil One'", axis: "wght@400", group: "futuristic" },
  { name: "Allerta Stencil", family: "'Allerta Stencil'", axis: "wght@400", group: "futuristic" },
  { name: "Stardos Stencil", family: "'Stardos Stencil'", axis: "wght@400;700", group: "futuristic" },
  { name: "Sirin Stencil", family: "'Sirin Stencil'", axis: "wght@400", group: "futuristic" },
  { name: "Emblema One", family: "'Emblema One'", axis: "wght@400", group: "futuristic" },
  { name: "Codystar", family: "'Codystar'", axis: "wght@300;400", group: "futuristic" },
  { name: "Ropa Sans", family: "'Ropa Sans'", axis: "wght@400", group: "futuristic" },
  { name: "Prosto One", family: "'Prosto One'", axis: "wght@400", group: "futuristic" },
  { name: "Kelly Slab", family: "'Kelly Slab'", axis: "wght@400", group: "futuristic" },
  { name: "Sansation", family: "'Sansation'", axis: "wght@300;400;700", group: "futuristic" },
  { name: "Iceland", family: "'Iceland'", axis: "wght@400", group: "futuristic" },
  { name: "Nova Oval", family: "'Nova Oval'", axis: "wght@400", group: "futuristic" },
  { name: "Nova Cut", family: "'Nova Cut'", axis: "wght@400", group: "futuristic" },
  { name: "Nova Script", family: "'Nova Script'", axis: "wght@400", group: "futuristic" },
  { name: "Nova Slim", family: "'Nova Slim'", axis: "wght@400", group: "futuristic" },
  { name: "Lobster Two", family: "'Lobster Two'", axis: "wght@400;700", group: "script" },
  { name: "Dancing Script", family: "'Dancing Script'", axis: "wght@400..700", group: "script" },
  { name: "Great Vibes", family: "'Great Vibes'", axis: "wght@400", group: "script" },
  { name: "Satisfy", family: "'Satisfy'", axis: "wght@400", group: "script" },
  { name: "Cookie", family: "'Cookie'", axis: "wght@400", group: "script" },
  { name: "Courgette", family: "'Courgette'", axis: "wght@400", group: "script" },
  { name: "Sacramento", family: "'Sacramento'", axis: "wght@400", group: "script" },
  { name: "Yellowtail", family: "'Yellowtail'", axis: "wght@400", group: "script" },
  { name: "Allura", family: "'Allura'", axis: "wght@400", group: "script" },
  { name: "Alex Brush", family: "'Alex Brush'", axis: "wght@400", group: "script" },
  { name: "Parisienne", family: "'Parisienne'", axis: "wght@400", group: "script" },
  { name: "Tangerine", family: "'Tangerine'", axis: "wght@400;700", group: "script" },
  { name: "Pinyon Script", family: "'Pinyon Script'", axis: "wght@400", group: "script" },
  { name: "Mr Dafoe", family: "'Mr Dafoe'", axis: "wght@400", group: "script" },
  { name: "Norican", family: "'Norican'", axis: "wght@400", group: "script" },
  { name: "Oleo Script", family: "'Oleo Script'", axis: "wght@400;700", group: "script" },
  { name: "Oleo Script Swash Caps", family: "'Oleo Script Swash Caps'", axis: "wght@400;700", group: "script" },
  { name: "Sansita Swashed", family: "'Sansita Swashed'", axis: "wght@300..900", group: "script" },
  { name: "Berkshire Swash", family: "'Berkshire Swash'", axis: "wght@400", group: "script" },
  { name: "Playball", family: "'Playball'", axis: "wght@400", group: "script" },
  { name: "Damion", family: "'Damion'", axis: "wght@400", group: "script" },
  { name: "Marck Script", family: "'Marck Script'", axis: "wght@400", group: "script" },
  { name: "Caveat", family: "'Caveat'", axis: "wght@400..700", group: "script" },
  { name: "Shadows Into Light", family: "'Shadows Into Light'", axis: "wght@400", group: "script" },
  { name: "Indie Flower", family: "'Indie Flower'", axis: "wght@400", group: "script" },
  { name: "Amatic SC", family: "'Amatic SC'", axis: "wght@400;700", group: "script" },
  { name: "Rock Salt", family: "'Rock Salt'", axis: "wght@400", group: "script" },
  { name: "Homemade Apple", family: "'Homemade Apple'", axis: "wght@400", group: "script" },
  { name: "Nothing You Could Do", family: "'Nothing You Could Do'", axis: "wght@400", group: "script" },
  { name: "Reenie Beanie", family: "'Reenie Beanie'", axis: "wght@400", group: "script" },
  { name: "Covered By Your Grace", family: "'Covered By Your Grace'", axis: "wght@400", group: "script" },
  { name: "Gloria Hallelujah", family: "'Gloria Hallelujah'", axis: "wght@400", group: "script" },
  { name: "Architects Daughter", family: "'Architects Daughter'", axis: "wght@400", group: "script" },
  { name: "Patrick Hand", family: "'Patrick Hand'", axis: "wght@400", group: "script" },
  { name: "Kalam", family: "'Kalam'", axis: "wght@300;400;700", group: "script" },
  { name: "Handlee", family: "'Handlee'", axis: "wght@400", group: "script" },
  { name: "Neucha", family: "'Neucha'", axis: "wght@400", group: "script" },
  { name: "Comic Neue", family: "'Comic Neue'", axis: "wght@300;400;700", group: "script" },
  { name: "Bad Script", family: "'Bad Script'", axis: "wght@400", group: "script" },
  { name: "Merienda", family: "'Merienda'", axis: "wght@300..900", group: "script" },
  { name: "Niconne", family: "'Niconne'", axis: "wght@400", group: "script" },
  { name: "Rochester", family: "'Rochester'", axis: "wght@400", group: "script" },
  { name: "Rouge Script", family: "'Rouge Script'", axis: "wght@400", group: "script" },
  { name: "Herr Von Muellerhoff", family: "'Herr Von Muellerhoff'", axis: "wght@400", group: "script" },
  { name: "Monsieur La Doulaise", family: "'Monsieur La Doulaise'", axis: "wght@400", group: "script" },
  { name: "Mrs Saint Delafield", family: "'Mrs Saint Delafield'", axis: "wght@400", group: "script" },
  { name: "Italianno", family: "'Italianno'", axis: "wght@400", group: "script" },
  { name: "Grand Hotel", family: "'Grand Hotel'", axis: "wght@400", group: "script" },
  { name: "Lily Script One", family: "'Lily Script One'", axis: "wght@400", group: "script" },
  { name: "Leckerli One", family: "'Leckerli One'", axis: "wght@400", group: "script" },
  { name: "Style Script", family: "'Style Script'", axis: "wght@400", group: "script" },
  { name: "Cherish", family: "'Cherish'", axis: "wght@400", group: "script" },
  { name: "Carattere", family: "'Carattere'", axis: "wght@400", group: "script" },
  { name: "Caramel", family: "'Caramel'", axis: "wght@400", group: "script" },
  { name: "Ephesis", family: "'Ephesis'", axis: "wght@400", group: "script" },
  { name: "Ms Madi", family: "'Ms Madi'", axis: "wght@400", group: "script" },
  { name: "Send Flowers", family: "'Send Flowers'", axis: "wght@400", group: "script" },
  { name: "Splash", family: "'Splash'", axis: "wght@400", group: "script" },
  { name: "Water Brush", family: "'Water Brush'", axis: "wght@400", group: "script" },
  { name: "Whisper", family: "'Whisper'", axis: "wght@400", group: "script" },
  { name: "Ballet", family: "'Ballet'", axis: "wght@400", group: "script" },
  { name: "Birthstone", family: "'Birthstone'", axis: "wght@400", group: "script" },
  { name: "Bonheur Royale", family: "'Bonheur Royale'", axis: "wght@400", group: "script" },
  { name: "Corinthia", family: "'Corinthia'", axis: "wght@400;700", group: "script" },
  { name: "Estonia", family: "'Estonia'", axis: "wght@400", group: "script" },
  { name: "Hurricane", family: "'Hurricane'", axis: "wght@400", group: "script" },
  { name: "Imperial Script", family: "'Imperial Script'", axis: "wght@400", group: "script" },
  { name: "Inspiration", family: "'Inspiration'", axis: "wght@400", group: "script" },
  { name: "Island Moments", family: "'Island Moments'", axis: "wght@400", group: "script" },
  { name: "Kolker Brush", family: "'Kolker Brush'", axis: "wght@400", group: "script" },
  { name: "Lavishly Yours", family: "'Lavishly Yours'", axis: "wght@400", group: "script" },
  { name: "Love Light", family: "'Love Light'", axis: "wght@400", group: "script" },
  { name: "Luxurious Script", family: "'Luxurious Script'", axis: "wght@400", group: "script" },
  { name: "Meow Script", family: "'Meow Script'", axis: "wght@400", group: "script" },
  { name: "Moon Dance", family: "'Moon Dance'", axis: "wght@400", group: "script" },
  { name: "Mea Culpa", family: "'Mea Culpa'", axis: "wght@400", group: "script" },
  { name: "Neonderthaw", family: "'Neonderthaw'", axis: "wght@400", group: "script" },
  { name: "Oooh Baby", family: "'Oooh Baby'", axis: "wght@400", group: "script" },
  { name: "Passions Conflict", family: "'Passions Conflict'", axis: "wght@400", group: "script" },
  { name: "Petemoss", family: "'Petemoss'", axis: "wght@400", group: "script" },
  { name: "Puppies Play", family: "'Puppies Play'", axis: "wght@400", group: "script" },
  { name: "Qwitcher Grypen", family: "'Qwitcher Grypen'", axis: "wght@400;700", group: "script" },
  { name: "Sassy Frass", family: "'Sassy Frass'", axis: "wght@400", group: "script" },
  { name: "Smooch", family: "'Smooch'", axis: "wght@400", group: "script" },
  { name: "Square Peg", family: "'Square Peg'", axis: "wght@400", group: "script" },
  { name: "Tapestry", family: "'Tapestry'", axis: "wght@400", group: "script" },
  { name: "The Nautigal", family: "'The Nautigal'", axis: "wght@400;700", group: "script" },
  { name: "Twinkle Star", family: "'Twinkle Star'", axis: "wght@400", group: "script" },
  { name: "Updock", family: "'Updock'", axis: "wght@400", group: "script" },
  { name: "Vujahday Script", family: "'Vujahday Script'", axis: "wght@400", group: "script" },
  { name: "Waterfall", family: "'Waterfall'", axis: "wght@400", group: "script" },
  { name: "Comforter", family: "'Comforter'", axis: "wght@400", group: "script" },
  { name: "Comforter Brush", family: "'Comforter Brush'", axis: "wght@400", group: "script" },
  { name: "Explora", family: "'Explora'", axis: "wght@400", group: "script" },
  { name: "Festive", family: "'Festive'", axis: "wght@400", group: "script" },
  { name: "Gwendolyn", family: "'Gwendolyn'", axis: "wght@400;700", group: "script" },
  { name: "Licorice", family: "'Licorice'", axis: "wght@400", group: "script" },
  { name: "Mrs Sheppards", family: "'Mrs Sheppards'", axis: "wght@400", group: "script" },
  { name: "My Soul", family: "'My Soul'", axis: "wght@400", group: "script" },
  { name: "Praise", family: "'Praise'", axis: "wght@400", group: "script" },
  { name: "Babylonica", family: "'Babylonica'", axis: "wght@400", group: "script" },
  { name: "Beau Rivage", family: "'Beau Rivage'", axis: "wght@400", group: "script" },
  { name: "Fuggles", family: "'Fuggles'", axis: "wght@400", group: "script" },
  { name: "Charm", family: "'Charm'", axis: "wght@400;700", group: "script" },
  { name: "Charmonman", family: "'Charmonman'", axis: "wght@400;700", group: "script" },
  { name: "Mali", family: "'Mali'", axis: "wght@200;300;400;500;600;700", group: "script" },
  { name: "Itim", family: "'Itim'", axis: "wght@400", group: "script" },
  { name: "Sriracha", family: "'Sriracha'", axis: "wght@400", group: "script" },
  { name: "Pattaya", family: "'Pattaya'", axis: "wght@400", group: "script" },
  { name: "Sofia", family: "'Sofia'", axis: "wght@400", group: "script" },
  { name: "Euphoria Script", family: "'Euphoria Script'", axis: "wght@400", group: "script" },
  { name: "Clicker Script", family: "'Clicker Script'", axis: "wght@400", group: "script" },
  { name: "Engagement", family: "'Engagement'", axis: "wght@400", group: "script" },
  { name: "Kristi", family: "'Kristi'", axis: "wght@400", group: "script" },
  { name: "La Belle Aurore", family: "'La Belle Aurore'", axis: "wght@400", group: "script" },
  { name: "Meddon", family: "'Meddon'", axis: "wght@400", group: "script" },
  { name: "Over the Rainbow", family: "'Over the Rainbow'", axis: "wght@400", group: "script" },
  { name: "Sue Ellen Francisco", family: "'Sue Ellen Francisco'", axis: "wght@400", group: "script" },
  { name: "Zeyada", family: "'Zeyada'", axis: "wght@400", group: "script" },
  { name: "Cedarville Cursive", family: "'Cedarville Cursive'", axis: "wght@400", group: "script" },
  { name: "Dawning of a New Day", family: "'Dawning of a New Day'", axis: "wght@400", group: "script" },
  { name: "Give You Glory", family: "'Give You Glory'", axis: "wght@400", group: "script" },
  { name: "Just Me Again Down Here", family: "'Just Me Again Down Here'", axis: "wght@400", group: "script" },
  { name: "Loved by the King", family: "'Loved by the King'", axis: "wght@400", group: "script" },
  { name: "Waiting for the Sunrise", family: "'Waiting for the Sunrise'", axis: "wght@400", group: "script" },
  { name: "Calligraffitti", family: "'Calligraffitti'", axis: "wght@400", group: "script" },
  { name: "Coming Soon", family: "'Coming Soon'", axis: "wght@400", group: "script" },
  { name: "Crafty Girls", family: "'Crafty Girls'", axis: "wght@400", group: "script" },
  { name: "Delius", family: "'Delius'", axis: "wght@400", group: "script" },
  { name: "Delius Swash Caps", family: "'Delius Swash Caps'", axis: "wght@400", group: "script" },
  { name: "Gochi Hand", family: "'Gochi Hand'", axis: "wght@400", group: "script" },
  { name: "Just Another Hand", family: "'Just Another Hand'", axis: "wght@400", group: "script" },
  { name: "Schoolbell", family: "'Schoolbell'", axis: "wght@400", group: "script" },
  { name: "Short Stack", family: "'Short Stack'", axis: "wght@400", group: "script" },
  { name: "Sunshiney", family: "'Sunshiney'", axis: "wght@400", group: "script" },
  { name: "Swanky and Moo Moo", family: "'Swanky and Moo Moo'", axis: "wght@400", group: "script" },
  { name: "Walter Turncoat", family: "'Walter Turncoat'", axis: "wght@400", group: "script" },
  { name: "Annie Use Your Telescope", family: "'Annie Use Your Telescope'", axis: "wght@400", group: "script" },
  { name: "Chilanka", family: "'Chilanka'", axis: "wght@400", group: "script" },
  { name: "Gaegu", family: "'Gaegu'", axis: "wght@300;400;700", group: "script" },
  { name: "Nanum Pen Script", family: "'Nanum Pen Script'", axis: "wght@400", group: "script" },
  { name: "Nanum Brush Script", family: "'Nanum Brush Script'", axis: "wght@400", group: "script" },
  { name: "Hi Melody", family: "'Hi Melody'", axis: "wght@400", group: "script" },
  { name: "Dokdo", family: "'Dokdo'", axis: "wght@400", group: "script" },
  { name: "East Sea Dokdo", family: "'East Sea Dokdo'", axis: "wght@400", group: "script" },
  { name: "Gamja Flower", family: "'Gamja Flower'", axis: "wght@400", group: "script" },
  { name: "Poor Story", family: "'Poor Story'", axis: "wght@400", group: "script" },
  { name: "Yeon Sung", family: "'Yeon Sung'", axis: "wght@400", group: "script" },
  { name: "Cute Font", family: "'Cute Font'", axis: "wght@400", group: "script" },
  { name: "Do Hyeon", family: "'Do Hyeon'", axis: "wght@400", group: "script" },
  { name: "Jua", family: "'Jua'", axis: "wght@400", group: "script" },
  { name: "Kirang Haerang", family: "'Kirang Haerang'", axis: "wght@400", group: "script" },
  { name: "Black Han Sans", family: "'Black Han Sans'", axis: "wght@400", group: "script" },
  { name: "Black And White Picture", family: "'Black And White Picture'", axis: "wght@400", group: "script" },
  { name: "Gugi", family: "'Gugi'", axis: "wght@400", group: "script" },
  { name: "Hahmlet", family: "'Hahmlet'", axis: "wght@100..900", group: "script" },
  { name: "Gowun Dodum", family: "'Gowun Dodum'", axis: "wght@400", group: "script" },
  { name: "Gowun Batang", family: "'Gowun Batang'", axis: "wght@400;700", group: "script" },
  { name: "Nanum Gothic", family: "'Nanum Gothic'", axis: "wght@400;700;800", group: "script" },
  { name: "Nanum Myeongjo", family: "'Nanum Myeongjo'", axis: "wght@400;700;800", group: "script" },
  { name: "Noto Sans KR", family: "'Noto Sans KR'", axis: "wght@100..900", group: "script" },
  { name: "Rye", family: "'Rye'", axis: "wght@400", group: "display" },
  { name: "Vast Shadow", family: "'Vast Shadow'", axis: "wght@400", group: "display" },
  { name: "Chewy", family: "'Chewy'", axis: "wght@400", group: "display" },
  { name: "Ranchers", family: "'Ranchers'", axis: "wght@400", group: "display" },
  { name: "Londrina Solid", family: "'Londrina Solid'", axis: "wght@100;300;400;900", group: "display" },
  { name: "Londrina Shadow", family: "'Londrina Shadow'", axis: "wght@400", group: "display" },
  { name: "Londrina Outline", family: "'Londrina Outline'", axis: "wght@400", group: "display" },
  { name: "Londrina Sketch", family: "'Londrina Sketch'", axis: "wght@400", group: "display" },
  { name: "Fredericka the Great", family: "'Fredericka the Great'", axis: "wght@400", group: "display" },
  { name: "Modak", family: "'Modak'", axis: "wght@400", group: "display" },
  { name: "Kavoon", family: "'Kavoon'", axis: "wght@400", group: "display" },
  { name: "Lemon", family: "'Lemon'", axis: "wght@400", group: "display" },
  { name: "Cherry Cream Soda", family: "'Cherry Cream Soda'", axis: "wght@400", group: "display" },
  { name: "Frijole", family: "'Frijole'", axis: "wght@400", group: "display" },
  { name: "Knewave", family: "'Knewave'", axis: "wght@400", group: "display" },
  { name: "Original Surfer", family: "'Original Surfer'", axis: "wght@400", group: "display" },
  { name: "Sonsie One", family: "'Sonsie One'", axis: "wght@400", group: "display" },
  { name: "Spicy Rice", family: "'Spicy Rice'", axis: "wght@400", group: "display" },
  { name: "Ribeye", family: "'Ribeye'", axis: "wght@400", group: "display" },
  { name: "Ribeye Marrow", family: "'Ribeye Marrow'", axis: "wght@400", group: "display" },
  { name: "Sedgwick Ave", family: "'Sedgwick Ave'", axis: "wght@400", group: "display" },
  { name: "Sedgwick Ave Display", family: "'Sedgwick Ave Display'", axis: "wght@400", group: "display" },
  { name: "Slackey", family: "'Slackey'", axis: "wght@400", group: "display" },
  { name: "Trade Winds", family: "'Trade Winds'", axis: "wght@400", group: "display" },
  { name: "Freckle Face", family: "'Freckle Face'", axis: "wght@400", group: "display" },
  { name: "Fontdiner Swanky", family: "'Fontdiner Swanky'", axis: "wght@400", group: "display" },
  { name: "Henny Penny", family: "'Henny Penny'", axis: "wght@400", group: "display" },
  { name: "Nixie One", family: "'Nixie One'", axis: "wght@400", group: "display" },
  { name: "Elsie", family: "'Elsie'", axis: "wght@400;900", group: "display" },
  { name: "Mystery Quest", family: "'Mystery Quest'", axis: "wght@400", group: "display" },
  { name: "Protest Revolution", family: "'Protest Revolution'", axis: "wght@400", group: "display" },
  { name: "Protest Guerrilla", family: "'Protest Guerrilla'", axis: "wght@400", group: "display" },
  { name: "Alumni Sans", family: "'Alumni Sans'", axis: "wght@100..900", group: "display" },
  { name: "Alumni Sans Collegiate One", family: "'Alumni Sans Collegiate One'", axis: "wght@400", group: "display" },
  { name: "Alumni Sans Inline One", family: "'Alumni Sans Inline One'", axis: "wght@400", group: "display" },
  { name: "Alumni Sans Pinstripe", family: "'Alumni Sans Pinstripe'", axis: "wght@400", group: "display" },
  { name: "Graduate", family: "'Graduate'", axis: "wght@400", group: "display" },
  { name: "Carter One", family: "'Carter One'", axis: "wght@400", group: "display" },
  { name: "Coda", family: "'Coda'", axis: "wght@400;800", group: "display" },
  { name: "Coiny", family: "'Coiny'", axis: "wght@400", group: "display" },
  { name: "Fascinate", family: "'Fascinate'", axis: "wght@400", group: "display" },
  { name: "Fascinate Inline", family: "'Fascinate Inline'", axis: "wght@400", group: "display" },
  { name: "Flavors", family: "'Flavors'", axis: "wght@400", group: "display" },
  { name: "Galindo", family: "'Galindo'", axis: "wght@400", group: "display" },
  { name: "Gorditas", family: "'Gorditas'", axis: "wght@400;700", group: "display" },
  { name: "Hanalei", family: "'Hanalei'", axis: "wght@400", group: "display" },
  { name: "Hanalei Fill", family: "'Hanalei Fill'", axis: "wght@400", group: "display" },
  { name: "Joti One", family: "'Joti One'", axis: "wght@400", group: "display" },
  { name: "Kumar One", family: "'Kumar One'", axis: "wght@400", group: "display" },
  { name: "Kumar One Outline", family: "'Kumar One Outline'", axis: "wght@400", group: "display" },
  { name: "Lakki Reddy", family: "'Lakki Reddy'", axis: "wght@400", group: "display" },
  { name: "Margarine", family: "'Margarine'", axis: "wght@400", group: "display" },
  { name: "Metal Mania", family: "'Metal Mania'", axis: "wght@400", group: "display" },
  { name: "Miltonian", family: "'Miltonian'", axis: "wght@400", group: "display" },
  { name: "Miltonian Tattoo", family: "'Miltonian Tattoo'", axis: "wght@400", group: "display" },
  { name: "Moul", family: "'Moul'", axis: "wght@400", group: "display" },
  { name: "Mouse Memoirs", family: "'Mouse Memoirs'", axis: "wght@400", group: "display" },
  { name: "New Rocker", family: "'New Rocker'", axis: "wght@400", group: "display" },
  { name: "Nosifer", family: "'Nosifer'", axis: "wght@400", group: "display" },
  { name: "Piedra", family: "'Piedra'", axis: "wght@400", group: "display" },
  { name: "Pirata One", family: "'Pirata One'", axis: "wght@400", group: "display" },
  { name: "Sancreek", family: "'Sancreek'", axis: "wght@400", group: "display" },
  { name: "Sarina", family: "'Sarina'", axis: "wght@400", group: "display" },
  { name: "Shojumaru", family: "'Shojumaru'", axis: "wght@400", group: "display" },
  { name: "Smokum", family: "'Smokum'", axis: "wght@400", group: "display" },
  { name: "Snowburst One", family: "'Snowburst One'", axis: "wght@400", group: "display" },
  { name: "Stint Ultra Expanded", family: "'Stint Ultra Expanded'", axis: "wght@400", group: "display" },
  { name: "Stint Ultra Condensed", family: "'Stint Ultra Condensed'", axis: "wght@400", group: "display" },
  { name: "Supermercado One", family: "'Supermercado One'", axis: "wght@400", group: "display" },
  { name: "Trochut", family: "'Trochut'", axis: "wght@400;700", group: "display" },
  { name: "Unkempt", family: "'Unkempt'", axis: "wght@400;700", group: "display" },
  { name: "Wendy One", family: "'Wendy One'", axis: "wght@400", group: "display" },
  { name: "Zilla Slab Highlight", family: "'Zilla Slab Highlight'", axis: "wght@400;700", group: "display" },
  { name: "Reggae One", family: "'Reggae One'", axis: "wght@400", group: "display" },
  { name: "RocknRoll One", family: "'RocknRoll One'", axis: "wght@400", group: "display" },
  { name: "Rampart One", family: "'Rampart One'", axis: "wght@400", group: "display" },
  { name: "Stick", family: "'Stick'", axis: "wght@400", group: "display" },
  { name: "Train One", family: "'Train One'", axis: "wght@400", group: "display" },
  { name: "Yusei Magic", family: "'Yusei Magic'", axis: "wght@400", group: "display" },
  { name: "Kaisei Opti", family: "'Kaisei Opti'", axis: "wght@400;500;700", group: "display" },
  { name: "Kaisei Decol", family: "'Kaisei Decol'", axis: "wght@400;500;700", group: "display" },
  { name: "Kaisei HarunoUmi", family: "'Kaisei HarunoUmi'", axis: "wght@400;500;700", group: "display" },
  { name: "Kaisei Tokumin", family: "'Kaisei Tokumin'", axis: "wght@400;500;700;800", group: "display" },
  { name: "Potta One", family: "'Potta One'", axis: "wght@400", group: "display" },
  { name: "Hachi Maru Pop", family: "'Hachi Maru Pop'", axis: "wght@400", group: "display" },
  { name: "Yomogi", family: "'Yomogi'", axis: "wght@400", group: "display" },
  { name: "Zen Antique", family: "'Zen Antique'", axis: "wght@400", group: "display" },
  { name: "Zen Kurenaido", family: "'Zen Kurenaido'", axis: "wght@400", group: "display" },
  { name: "Zen Loop", family: "'Zen Loop'", axis: "wght@400", group: "display" },
  { name: "Zen Maru Gothic", family: "'Zen Maru Gothic'", axis: "wght@300;400;500;700;900", group: "display" },
  { name: "Zen Old Mincho", family: "'Zen Old Mincho'", axis: "wght@400;500;600;700;900", group: "display" },
  { name: "Klee One", family: "'Klee One'", axis: "wght@400;600", group: "display" },
  { name: "Shippori Antique", family: "'Shippori Antique'", axis: "wght@400", group: "display" },
  { name: "Shippori Antique B1", family: "'Shippori Antique B1'", axis: "wght@400", group: "display" },
  { name: "Mochiy Pop P One", family: "'Mochiy Pop P One'", axis: "wght@400", group: "display" },
  { name: "Murecho", family: "'Murecho'", axis: "wght@100..900", group: "display" },
  { name: "M PLUS 1", family: "'M PLUS 1'", axis: "wght@100..900", group: "display" },
  { name: "M PLUS 2", family: "'M PLUS 2'", axis: "wght@100..900", group: "display" },
  { name: "M PLUS 1 Code", family: "'M PLUS 1 Code'", axis: "wght@100..700", group: "display" },
  { name: "BIZ UDPGothic", family: "'BIZ UDPGothic'", axis: "wght@400;700", group: "display" },
  { name: "BIZ UDPMincho", family: "'BIZ UDPMincho'", axis: "wght@400;700", group: "display" },
  { name: "Kosugi", family: "'Kosugi'", axis: "wght@400", group: "display" },
  { name: "Kosugi Maru", family: "'Kosugi Maru'", axis: "wght@400", group: "display" },
  { name: "Sawarabi Gothic", family: "'Sawarabi Gothic'", axis: "wght@400", group: "display" },
  { name: "Sawarabi Mincho", family: "'Sawarabi Mincho'", axis: "wght@400", group: "display" },
  { name: "Hina Mincho", family: "'Hina Mincho'", axis: "wght@400", group: "display" },
  { name: "Yuji Boku", family: "'Yuji Boku'", axis: "wght@400", group: "display" },
  { name: "Yuji Mai", family: "'Yuji Mai'", axis: "wght@400", group: "display" },
  { name: "Yuji Syuku", family: "'Yuji Syuku'", axis: "wght@400", group: "display" },
  { name: "Yuji Hentaigana Akari", family: "'Yuji Hentaigana Akari'", axis: "wght@400", group: "display" },
  { name: "Yuji Hentaigana Akebono", family: "'Yuji Hentaigana Akebono'", axis: "wght@400", group: "display" },
];

type Saved = { id?: string; from?: string; icon: string; by: string; font: string; body: string; primary: string; casing: Casing; tracking: Tracking; weight: number; size: number; hover: string };
type Persisted = { history: Saved[]; cursor: number };
const NS = `logo-creator:${BRAND.toLowerCase()}`;
const KEY = `${NS}:history`;
const SAVED_KEY = `${NS}:saved`;
const BACKUP_KEY = `${NS}:saved-backup`;
const FLAG = (name: string) => `${NS}:${name}`;
const CURRENT_FONT = "Current (Orbitron)";
const CURRENT_BODY = "Current (Montserrat)";
const CURRENT_PRIMARY = "#34D399";
const SAVED_DEFAULT: Saved = { icon: "current", by: "hypertheory", font: CURRENT_FONT, body: CURRENT_BODY, primary: CURRENT_PRIMARY, casing: "upper", tracking: "wide", weight: 500, size: 20, hover: "none" };
const MAX_HISTORY = 20;
const HIDE_VERSION = "4";
const COMPARE: (keyof Saved)[] = ["icon", "by", "font", "body", "primary", "casing", "tracking", "weight", "size", "hover"];
const SAMPLE = "Every app in the fleet, one console, nothing left to guess";
const PRESETS = [
  "#E63B12", "#F04E23", "#FF3D00", "#FF5A1F", "#FF6A00", "#FF7A00", "#FF8A00", "#FF9500", "#FFA000", "#FFB000", "#FFC107", "#FFD000",
  "#E85D04", "#ED7014", "#F5A623", "#FF6F3C", "#FF4E50", "#FFB347", "#FFCC33", "#FDBA12", "#FF8C42", "#FF9F1C", "#F77F00", "#FCBF49",
  "#FF4500", "#0095FF", "#22C55E", "#3B82F6", "#34D399", "#FF0000", "#FF4000", "#FF8000", "#FFBF00", "#FFFF00", "#BFFF00", "#80FF00",
  "#40FF00", "#00FF00", "#00FF40", "#00FF80", "#00FFBF", "#00FFFF", "#00BFFF", "#007FFF", "#0040FF", "#0000FF", "#4000FF", "#7F00FF",
  "#BF00FF", "#FF00FF", "#FF00BF", "#FF0080", "#FF0040", "#FF3D3D", "#FF6E3D", "#FF9E3D", "#FFCF3D", "#FFFF3D", "#CFFF3D", "#9EFF3D",
  "#6EFF3D", "#3DFF3D", "#3DFF6E", "#3DFF9E", "#3DFFCF", "#3DFFFF", "#3DCFFF", "#3D9EFF", "#3D6EFF", "#3D3DFF", "#6E3DFF", "#9E3DFF",
  "#CF3DFF", "#FF3DFF", "#FF3DCF", "#FF3D9E", "#FF3D6E", "#D60000", "#D63600", "#D66B00", "#D6A100", "#D6D600", "#A1D600", "#6BD600",
  "#36D600", "#00D600", "#00D636", "#00D66B", "#00D6A1", "#00D6D6", "#00A1D6", "#006BD6", "#0036D6", "#0000D6", "#3600D6", "#6B00D6",
  "#A100D6", "#D600D6", "#D600A1", "#D6006B", "#D60036", "#E93535", "#E96235", "#E98F35", "#E9BC35", "#E9E935", "#BCE935", "#8FE935",
  "#62E935", "#35E935", "#35E962", "#35E98F", "#35E9BC", "#35E9E9", "#35BCE9", "#358FE9", "#3562E9", "#3535E9", "#6235E9", "#8F35E9",
  "#BC35E9", "#E935E9", "#E935BC", "#E9358F", "#E93562", "#CA2B2B", "#CA532B", "#CA7A2B", "#CAA22B", "#CACA2B", "#A2CA2B", "#7ACA2B",
  "#53CA2B", "#2BCA2B", "#2BCA53", "#2BCA7A", "#2BCAA2", "#2BCACA", "#2BA2CA", "#2B7ACA", "#2B53CA", "#2B2BCA", "#532BCA", "#7A2BCA",
  "#A22BCA", "#CA2BCA", "#CA2BA2", "#CA2B7A", "#CA2B53", "#FF7070", "#FF9470", "#FFB870", "#FFDB70", "#FFFF70", "#DBFF70", "#B8FF70",
  "#94FF70", "#70FF70", "#70FF94", "#70FFB8", "#70FFDB", "#70FFFF", "#70DBFF", "#70B8FF", "#7094FF", "#7070FF", "#9470FF", "#B870FF",
  "#DB70FF", "#FF70FF", "#FF70DB", "#FF70B8", "#FF7094",
];
const PRESET_NAMES: Record<string, string> = { "#FF4500": "Ghostplug", "#0095FF": "Brandflare", "#22C55E": "StonedGPT", "#3B82F6": "Recruiterbase", "#0284C7": "Whaletrail", "#34D399": "Hypertheory", "#E63B12": "Vermilion", "#F04E23": "Chili", "#FF3D00": "Ember", "#FF5A1F": "Blaze", "#FF6A00": "Tangerine", "#FF7A00": "Flare", "#FF8A00": "Marigold", "#FF9500": "Apricot", "#FFA000": "Amber", "#FFB000": "Saffron", "#FFC107": "Gold", "#FFD000": "Sunflower", "#E85D04": "Burnt orange", "#ED7014": "Carrot", "#F5A623": "Honey", "#FF6F3C": "Persimmon", "#FF4E50": "Coral heat", "#FFB347": "Peach", "#FFCC33": "Yellow gold", "#FDBA12": "Mustard", "#FF8C42": "Cantaloupe", "#FF9F1C": "Orange peel", "#F77F00": "Pumpkin", "#FCBF49": "Maize" };

const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const same = (a: Saved, b: Saved) => COMPARE.every((k) => a[k] === b[k]);
const normalize = (h: Partial<Saved>): Saved => {
  const s = { ...SAVED_DEFAULT, ...h };
  if (!h.by) s.by = LAB_ICONS.find((i) => i.name === s.icon)?.by ?? "lorc";
  return s;
};
const withIds = (list: Saved[]) => list.map((s) => (s.id ? s : { ...s, id: newId() }));

function readList(key: string): Saved[] {
  try {
    const raw = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(raw) ? raw.map(normalize) : [];
  } catch {
    return [];
  }
}

function load(): Persisted {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || localStorage.getItem("logo-creator") || "{}");
    if (Array.isArray(raw.history) && raw.history.length) {
      const history = raw.history.slice(-MAX_HISTORY).map(normalize);
      return { history, cursor: Math.min(raw.cursor ?? history.length - 1, history.length - 1) };
    }
  } catch {}
  return { history: [SAVED_DEFAULT], cursor: 0 };
}

// Saved combos are precious: the hub's `lab` table is the source of truth (via the app's dev proxy), the
// brand-namespaced localStorage slot is a cache written only on explicit user actions, its previous value
// is copied to a backup slot on every write, and an empty cache falls back to the backup on load.
function loadSaved(): Saved[] {
  const list = readList(SAVED_KEY);
  if (list.length) return list;
  const backup = readList(BACKUP_KEY);
  if (backup.length) return backup;
  return readList("logo-creator-saved").length ? readList("logo-creator-saved") : readList("logo-creator-saved-backup");
}

function persistState(s: Persisted) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {}
}

function persistSaved(list: Saved[]) {
  try {
    const prev = localStorage.getItem(SAVED_KEY);
    if (prev && prev !== "[]") localStorage.setItem(BACKUP_KEY, prev);
    localStorage.setItem(SAVED_KEY, JSON.stringify(list));
  } catch {}
}

async function pullSaved(): Promise<{ saved: Saved[]; current: Saved | null } | null> {
  try {
    const res = await fetch(`/api/lab?brand=${BRAND.toLowerCase()}`, { cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const json = (await res.json()) as { saved?: Partial<Saved>[]; current?: Partial<Saved> | null };
    return { saved: Array.isArray(json.saved) ? json.saved.map(normalize) : [], current: json.current ? normalize(json.current) : null };
  } catch {
    return null;
  }
}

// Marks a combo as THE brand: the hub's AppBadge renders lab.current live (icon path included, so the
// hub needs no icon catalog), and the bake step reads it back when the app itself gets rewired.
async function pushCurrent(combo: Saved | null): Promise<boolean> {
  try {
    const icon = combo ? resolveIcon(combo.by, combo.icon) ?? (await fetchIcon(combo.by, combo.icon)) : null;
    const current = combo ? { ...combo, id: undefined, from: undefined, viewBox: icon?.viewBox ?? "0 0 24 24", d: icon?.d ?? "", stroke: icon?.stroke, rule: icon?.rule } : null;
    const res = await fetch("/api/lab", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ brand: BRAND.toLowerCase(), current }),
      signal: AbortSignal.timeout(8000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function pushSaved(list: Saved[]): Promise<boolean> {
  try {
    const res = await fetch("/api/lab", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ brand: BRAND.toLowerCase(), saved: list.map(({ from: _from, ...s }) => s), clear: list.length === 0 }),
      signal: AbortSignal.timeout(8000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

const merge = (a: Saved[], b: Saved[]) => withIds([...a, ...b.filter((x) => !a.some((y) => same(x, y)))]);

const pick = <T,>(list: T[], not: (t: T) => boolean) => {
  const pool = list.filter((t) => !not(t));
  return pool[Math.floor(Math.random() * pool.length)];
};

const rgb = (hex: string) => {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

function applyPrimary(hex: string) {
  const root = document.documentElement.style;
  if (hex.toUpperCase() === CURRENT_PRIMARY) {
    root.removeProperty("--primary-rgb");
    root.removeProperty("--primary-dark");
    return;
  }
  const [r, g, b] = rgb(hex);
  root.setProperty("--primary-rgb", `${r}, ${g}, ${b}`);
  root.setProperty("--primary-dark", `rgb(${Math.round(r * 0.85)}, ${Math.round(g * 0.85)}, ${Math.round(b * 0.85)})`);
}

const loadedFonts = new Set<string>();
function loadFont(f: Font) {
  if (typeof document === "undefined" || loadedFonts.has(f.name)) return;
  loadedFonts.add(f.name);
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(f.name).replace(/%20/g, "+")}${f.axis ? `:${f.axis}` : ""}&display=swap`;
  document.head.appendChild(link);
}
const family = (name: string) => {
  const f = FONTS.find((x) => x.name === name);
  if (f?.family) loadFont(f);
  return f?.family ?? undefined;
};

// Live favicon: the tab icon follows the chosen mark and color exactly the way app/icon.svg will once baked
// (icon.svg drives the favicon, apple icon, OG and Twitter images across the fleet). The original hrefs are
// kept so the current brand restores cleanly.
const originalIcons = new Map<HTMLLinkElement, string>();
function applyFavicon(icon: LabIcon | null, primary: string) {
  const links = Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="icon"], link[rel="shortcut icon"]'));
  if (!links.length) {
    const l = document.createElement("link");
    l.rel = "icon";
    document.head.appendChild(l);
    links.push(l);
  }
  for (const l of links) if (!originalIcons.has(l)) originalIcons.set(l, l.getAttribute("href") ?? "");
  const reset = !icon && primary.toUpperCase() === CURRENT_PRIMARY;
  for (const l of links) {
    if (reset) {
      const href = originalIcons.get(l);
      if (href) l.setAttribute("href", href);
      l.removeAttribute("type");
      continue;
    }
    const d = icon?.d ?? LAB_ICONS[0].d;
    const viewBox = icon?.viewBox ?? LAB_ICONS[0].viewBox;
    // Hypertheory's mark carries no brand color: near-black, near-white in dark, exactly like app/icon.svg.
    const stroke = icon?.stroke ? ` fill="none" stroke="#171717" stroke-width="${icon.stroke}" stroke-linecap="round" stroke-linejoin="round"` : ` fill="#171717"`;
    const rule = icon?.rule ? ` fill-rule="${icon.rule}"` : "";
    const dark = icon?.stroke ? "path{stroke:#fafafa}" : "path{fill:#fafafa}";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}"><style>@media(prefers-color-scheme:dark){${dark}}</style><path${stroke}${rule} d="${d}"/></svg>`;
    l.setAttribute("type", "image/svg+xml");
    l.setAttribute("href", `data:image/svg+xml,${encodeURIComponent(svg)}`);
  }
}

const CHIP = "px-2 py-0.5 rounded-md text-[11px] transition-colors";
const CHIP_ON = "bg-primary text-white";
const CHIP_OFF = "bg-backdrop-1 dark:bg-backdrop-2 text-main-2 hover:text-main";
const TOOL = "flex-row gap-1 px-1.5 py-1 rounded-md hover:bg-backdrop-1 dark:hover:bg-backdrop-2 text-main-2 hover:text-main disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-main-2 transition-colors";
const CELL = "aspect-square rounded-md flex-center transition-colors";

function IconSvg({ by, name, className, style }: { by: string; name: string; className?: string; style?: React.CSSProperties }) {
  useIconVersion();
  const icon = resolveIcon(by, name);
  const ref = useRef<HTMLSpanElement>(null);
  // Catalog icons load only once scrolled into view, so a whole author (Lorc alone is 1,429) can be browsed
  // without firing every fetch at once.
  useEffect(() => {
    if (icon) return;
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) {
      fetchIcon(by, name);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          fetchIcon(by, name);
          io.disconnect();
        }
      },
      { rootMargin: "300px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [by, name, icon]);
  if (!icon) return <span ref={ref} className={className} style={style} />;
  return (
    <svg viewBox={icon.viewBox} {...svgProps(icon)} className={className} style={style}>
      <path d={icon.d} {...pathProps(icon)} />
    </svg>
  );
}

function Mark({ combo, scale = 1 }: { combo: Saved; scale?: number }) {
  const tracking = { tight: "-0.025em", normal: "0", wide: "0.1em" }[combo.tracking];
  return (
    <span className="group inline-flex items-center gap-1 text-main">
      <IconSvg by={combo.by} name={combo.icon} className={`shrink-0 text-main ${HOVERS[combo.hover]?.cls ?? ""}`} style={{ width: combo.size * scale, height: combo.size * scale }} />
      <span style={{ fontFamily: family(combo.font), fontWeight: family(combo.font) ? combo.weight : 700, letterSpacing: tracking, fontSize: 18 * scale, lineHeight: 1 }}>
        {CASING[combo.casing]}
      </span>
    </span>
  );
}

function Stepper({ value, pool, onChange, sample }: { value: string; pool: { name: string }[]; onChange: (name: string) => void; sample: React.ReactNode }) {
  const idx = pool.findIndex((f) => f.name === value);
  const step = (d: number) => onChange(pool[(idx + d + pool.length) % pool.length].name);
  return (
    <div className="flex-between gap-2 px-2 py-1.5 rounded-md bg-backdrop-1 dark:bg-backdrop-2">
      <div className="min-w-0 flex-1">
        <div className="truncate">{sample}</div>
        <div className="text-[10px] text-main-3 truncate">
          {value}
          {idx >= 0 && <span className="tabular-nums">, {idx + 1}/{pool.length}</span>}
        </div>
      </div>
      <div className="flex-row shrink-0">
        <button onClick={() => step(-1)} className={TOOL} title="Previous">
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => step(1)} className={TOOL} title="Next">
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function Chips<T extends string>({ options, value, onChange, label }: { options: T[]; value: T; onChange: (v: T) => void; label?: (v: T) => string }) {
  return (
    <div className="flex-row gap-1 flex-wrap">
      {options.map((o) => (
        <button key={o} onClick={() => onChange(o)} className={`${CHIP} ${value === o ? CHIP_ON : CHIP_OFF}`}>
          {label ? label(o) : o}
        </button>
      ))}
    </div>
  );
}

function Toolbar({ children, onShuffle, hint }: { children?: React.ReactNode; onShuffle: () => void; hint: string }) {
  return (
    <div className="flex-between gap-2">
      <div className="min-w-0 flex-1">{children}</div>
      <button onClick={onShuffle} className={`${TOOL} shrink-0`} title={hint}>
        <Shuffle className="w-3.5 h-3.5" />
        <span className="text-[11px]">shuffle</span>
      </button>
    </div>
  );
}

const TABS: [Tab, string][] = [["saved", "Saved"], ["icon", "Icon"], ["font", "Logo font"], ["body", "Body font"], ["color", "Color"], ["hover", "Hover"]];

export default function LogoCreator() {
  const [state, setState] = useState<Persisted>({ history: [SAVED_DEFAULT], cursor: 0 });
  const [savedList, setSavedList] = useState<Saved[]>([]);
  const [sync, setSync] = useState<"pending" | "synced" | "local">("pending");
  const [logoGroup, setLogoGroup] = useState<Group | "all">("all");
  const [bodyGroup, setBodyGroup] = useState<Group | "all">("common");
  const [query, setQuery] = useState("");
  const [author, setAuthor] = useState<Author>("picks");
  const [askSave, setAskSave] = useState(false);
  const [tab, setTab] = useState<Tab>("icon");
  const [current, setCurrent] = useState<Saved | null>(null);
  const [open, setOpen] = useState(true);
  // Starts hidden: the flag lives in localStorage, which only the effect below can read, and a panel that
  // rendered before the read came back flashed on every refresh even when it had been dismissed. Nothing
  // paints until the flag says it should.
  const [hidden, setHidden] = useState(true);

  // The X hides the whole panel until Dom asks for it back: bump HIDE_VERSION and the stored flag no longer
  // matches. The chosen brand keeps applying while hidden so the site can be judged without the panel.
  useEffect(() => {
    try {
      setHidden(localStorage.getItem(FLAG("hidden")) === HIDE_VERSION);
    } catch {}
  }, []);
  const hide = () => {
    try {
      localStorage.setItem(FLAG("hidden"), HIDE_VERSION);
    } catch {}
    setHidden(true);
  };
  // The X offers "Keep this one for now" when the selection is not yet the brand: it crowns the combo in the hub
  // (so the row shows what Dom is trialing) and rewrites app/icon.svg on this machine, so the favicon, apple
  // icon, Open Graph and Twitter images follow it too. Nothing is committed; bake or revert comes later.
  const [askKeep, setAskKeep] = useState(false);
  const [keeping, setKeeping] = useState(false);
  const lab = useLab();
  const saved = state.history[state.cursor];
  const savedMatch = savedList.find((s) => same(s, saved));
  const origin = saved.from ? savedList.find((s) => s.id === saved.from) : undefined;
  const dirtyFromOrigin = !!origin && !same(origin, saved);

  useEffect(() => {
    ensureLabStyles();
    const persisted = load();
    let list = loadSaved();
    setState(persisted);
    list = withIds(list);
    setSavedList(list);
    persistSaved(list);
    let cancelled = false;
    pullSaved().then(async (remote) => {
      if (cancelled) return;
      if (!remote) return setSync("local");
      setCurrent(remote.current);
      const merged = merge(remote.saved, list);
      setSavedList(merged);
      persistSaved(merged);
      const ok = merged.length === remote.saved.length || (await pushSaved(merged));
      if (!cancelled) setSync(ok ? "synced" : "local");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const apply = (icon: LabIcon | null) =>
      setLab({
        hover: saved.hover,
        icon: icon && icon.name !== "current" ? { viewBox: icon.viewBox, d: icon.d, stroke: icon.stroke, rule: icon.rule } : null,
        fontFamily: family(saved.font) ?? null,
        weight: saved.weight,
        casing: saved.casing,
        tracking: saved.tracking,
        size: saved.size,
      });
    const icon = resolveIcon(saved.by, saved.icon);
    const paint = (i: LabIcon | null) => {
      apply(i);
      applyFavicon(i && i.name !== "current" ? i : null, saved.primary);
    };
    if (icon || saved.icon === "current") paint(icon ?? null);
    else fetchIcon(saved.by, saved.icon).then(paint);
    document.body.style.fontFamily = family(saved.body) ?? "";
    applyPrimary(saved.primary);
  }, [saved]);

  const commit = (fn: (s: Persisted) => Persisted) =>
    setState((s) => {
      const next = fn(s);
      persistState(next);
      return next;
    });
  const commitSaved = (fn: (l: Saved[]) => Saved[]) =>
    setSavedList((l) => {
      const next = withIds(fn(l));
      persistSaved(next);
      pushSaved(next).then((ok) => setSync(ok ? "synced" : "local"));
      return next;
    });
  const update = (patch: Partial<Saved>) =>
    commit((s) => {
      const next = { ...s.history[s.cursor], ...patch };
      const history = [...s.history.slice(0, s.cursor + 1), next].slice(-MAX_HISTORY);
      return { history, cursor: history.length - 1 };
    });
  const back = () => commit((s) => ({ ...s, cursor: Math.max(0, s.cursor - 1) }));
  const forward = () => commit((s) => ({ ...s, cursor: Math.min(s.history.length - 1, s.cursor + 1) }));
  const poolOf = (g: Group | "all") => (g === "all" ? FONTS : FONTS.filter((f) => f.group === g));
  const randomIcon = () => {
    const i = pick(PICKS, (x) => x.name === saved.icon && x.by === saved.by);
    return { icon: i.name, by: i.by };
  };
  const randomWordmark = () => ({
    font: pick(poolOf(logoGroup), (f) => f.name === saved.font).name,
    casing: pick(Object.keys(CASING) as Casing[], () => false),
    tracking: pick(["tight", "normal", "wide"] as Tracking[], () => false),
  });
  const randomBody = () => ({ body: pick(poolOf(bodyGroup), (f) => f.name === saved.body).name });
  const randomColor = () => ({ primary: pick(PRESETS, (p) => p === saved.primary) });
  const randomHover = () => ({ hover: pick(Object.keys(HOVERS), (h) => h === saved.hover || h === "none") });
  const makeCurrent = (s: Saved) => {
    setCurrent(s);
    pushCurrent(s).then((ok) => setSync(ok ? "synced" : "local"));
  };
  const keepNow = async () => {
    setKeeping(true);
    const icon = saved.icon === "current" ? LAB_ICONS[0] : resolveIcon(saved.by, saved.icon) ?? (await fetchIcon(saved.by, saved.icon));
    if (icon) {
      try {
        await fetch("/api/lab/keep", {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ viewBox: icon.viewBox, d: icon.d, stroke: icon.stroke, rule: icon.rule }),
          signal: AbortSignal.timeout(8000),
        });
      } catch (e) {
        console.error("[logo creator] keep failed:", e);
      }
      makeCurrent(saved);
    }
    setKeeping(false);
    setAskKeep(false);
    hide();
  };
  // "Make this my logo" bakes the combo into the real code (see /api/lab/bake), crowns it, turns the panel's
  // "Current (...)" font names in the saved list into their real names so those saves keep meaning, then
  // reloads so the new layout fonts take effect.
  const bakeNow = async () => {
    setKeeping(true);
    const icon = saved.icon === "current" ? LAB_ICONS[0] : resolveIcon(saved.by, saved.icon) ?? (await fetchIcon(saved.by, saved.icon));
    if (!icon) return setKeeping(false);
    try {
      const res = await fetch("/api/lab/bake", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...saved, id: undefined, from: undefined, viewBox: icon.viewBox, d: icon.d, stroke: icon.stroke, rule: icon.rule }),
        signal: AbortSignal.timeout(60000),
      });
      if (!res.ok) throw new Error(await res.text());
      const real = (name: string) => name.replace(/^Current \((.*)\)$/, "$1");
      const list = savedList.map((s) => ({ ...s, font: s.font === CURRENT_FONT ? real(CURRENT_FONT) : s.font, body: s.body === CURRENT_BODY ? real(CURRENT_BODY) : s.body }));
      await pushSaved(list);
      persistSaved(list);
      await pushCurrent(saved);
      try {
        localStorage.setItem(FLAG("hidden"), HIDE_VERSION);
      } catch {}
      window.location.reload();
    } catch (e) {
      console.error("[logo creator] bake failed:", e);
      setKeeping(false);
    }
  };
  const onHide = () => {
    if (same(saved, SAVED_DEFAULT)) return hide();
    setAskKeep((a) => !a);
  };
  const saveNew = () => {
    const id = newId();
    commitSaved((l) => [...l, { ...saved, id, from: undefined }]);
    update({ from: id });
    setAskSave(false);
  };
  const saveOver = () => {
    commitSaved((l) => l.map((s) => (s.id === origin?.id ? { ...saved, id: s.id, from: undefined } : s)));
    setAskSave(false);
  };
  const onBookmark = () => {
    if (savedMatch) return commitSaved((l) => l.filter((s) => s.id !== savedMatch.id));
    if (dirtyFromOrigin) return setAskSave((a) => !a);
    saveNew();
  };
  // Picks is the curated grid; an author chip lists that author's whole catalog (icons load as they scroll into
  // view), and a search of two or more letters filters whichever is selected, uncapped.
  const browsing = author !== "picks" || query.trim().length >= 2;
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!browsing) return [];
    return CATALOG.filter(([by, name]) => (author === "picks" || author === "all" || by === author) && (q.length < 2 || name.includes(q)));
  }, [query, author, browsing]);

  const text = CASING[saved.casing];
  const groupOpts = ["all", ...GROUPS] as (Group | "all")[];
  const shuffleAll = () => update({ ...randomIcon(), ...randomWordmark(), ...randomBody(), ...randomColor(), ...randomHover() });

  if (hidden) return null;

  return (
    <div
      className={`fixed right-0 z-[100] w-[380px] flex flex-col bg-backdrop dark:bg-backdrop-1 shadow-around text-main text-xs overflow-hidden ${open ? "inset-y-0 rounded-l-xl" : "bottom-4 right-4 rounded-xl"}`}
      style={{ fontFamily: spaceGrotesk.style.fontFamily }}
    >
      <div className="flex-between px-3 py-1.5 border-b border-border">
        <span className="font-semibold">Logo Creator</span>
        <div className="flex-row gap-0.5 relative">
          <button onClick={shuffleAll} className={TOOL} title="Shuffle everything">
            <Shuffle className="w-3.5 h-3.5" />
            <span className="text-[11px]">all</span>
          </button>
          <button
            onClick={onBookmark}
            className={`${TOOL} ${savedMatch ? "text-primary hover:text-primary" : dirtyFromOrigin ? "text-amber-500 hover:text-amber-500" : ""}`}
            title={savedMatch ? "Unsave" : dirtyFromOrigin ? "Changed since it was saved" : "Save this combo"}
          >
            {savedMatch ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
          </button>
          {askSave && (
            <div className="absolute top-full right-0 mt-1 z-10 p-1 rounded-lg bg-backdrop-1 dark:bg-backdrop-2 shadow-around flex-row gap-1 whitespace-nowrap">
              <button onClick={saveOver} className="button-primary text-[11px] px-2 py-1">Update original</button>
              <button onClick={saveNew} className="text-[11px] px-2 py-1 rounded-md font-medium text-main-2 hover:text-main bg-backdrop-2 dark:bg-backdrop-3 transition-colors">Save as new</button>
            </div>
          )}
          <button onClick={back} disabled={state.cursor === 0} className={TOOL} title="Back">
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] text-main-3 tabular-nums w-10 text-center">
            {state.cursor + 1}/{state.history.length}
          </span>
          <button onClick={forward} disabled={state.cursor >= state.history.length - 1} className={TOOL} title="Forward">
            <Redo2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setOpen((o) => !o)} className={TOOL} title={open ? "Collapse" : "Expand"}>
            {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
          <button onClick={onHide} className={TOOL} title="Hide the panel">
            <X className="w-3.5 h-3.5" />
          </button>
          {askKeep && (
            <div className="absolute top-full right-0 mt-1 z-10 p-1 rounded-lg bg-backdrop-1 dark:bg-backdrop-2 shadow-around flex-row gap-1 whitespace-nowrap">
              <button onClick={bakeNow} disabled={keeping} className="button-primary text-[11px] px-2 py-1">Make this my logo</button>
              {!(current && same(current, saved)) && (
                <button onClick={keepNow} disabled={keeping} className="text-[11px] px-2 py-1 rounded-md font-medium text-main-2 hover:text-main bg-backdrop-2 dark:bg-backdrop-3 transition-colors">Keep for now</button>
              )}
              <button onClick={hide} className="text-[11px] px-2 py-1 rounded-md font-medium text-main-2 hover:text-main bg-backdrop-2 dark:bg-backdrop-3 transition-colors">Hide only</button>
            </div>
          )}
        </div>
      </div>

      {open && (
        <>
          <div className="px-4 py-3 border-b border-border flex flex-col gap-2">
            <div className="self-center">
              <Mark combo={saved} scale={2} />
            </div>
            <p className="text-[13px] text-main-2 leading-snug text-center" style={{ fontFamily: family(saved.body) }}>
              {SAMPLE}
            </p>
            <div className="flex-center gap-2" style={{ fontFamily: family(saved.body) }}>
              <span className="button-primary text-xs px-2 py-[3px]">Get started</span>
              <span className="text-primary text-xs underline">Learn more</span>
            </div>
            <div className="text-[10px] text-main-3 text-center leading-relaxed">
              {saved.icon} by {saved.by}, {saved.font} {saved.casing} {saved.tracking} {saved.weight} {saved.size}px
              <br />
              body {saved.body}, {saved.primary.toUpperCase()}, hover {HOVERS[saved.hover]?.label.toLowerCase() ?? saved.hover}
            </div>
          </div>

          <div className="flex-row px-2 pt-2 pb-0 gap-0.5 border-b border-border">
            {TABS.map(([id, label]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`px-2.5 py-1.5 text-[11px] rounded-t-md border-b-2 -mb-px transition-colors ${tab === id ? "border-primary text-main font-medium" : "border-transparent text-main-3 hover:text-main"}`}
              >
                {label}
                {id === "saved" && savedList.length > 0 && <span className="ml-1 text-main-3 tabular-nums">{savedList.length}</span>}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar px-3 py-3 space-y-2">
            {tab === "saved" && (
              <>
                <div className="flex-between">
                  <span className="text-main-3">Click to load, crown to make it the brand</span>
                  <span className="flex-row gap-1 text-[10px] text-main-3 shrink-0">
                    <span className={`w-1.5 h-1.5 rounded-full ${sync === "synced" ? "bg-green-500" : sync === "local" ? "bg-amber-500" : "bg-main-3"}`} />
                    {sync === "synced" ? "hub" : sync === "local" ? "local only" : "syncing"}
                  </span>
                </div>
                {savedList.length === 0 && <div className="text-main-3 py-6 text-center">Nothing saved yet</div>}
                <div className="space-y-0.5">
                  {savedList.map((s) => (
                    <div
                      key={s.id}
                      className={`group/saved flex-between px-2 py-1.5 rounded-md cursor-pointer transition-colors ${same(s, saved) ? "bg-backdrop-1 dark:bg-backdrop-2" : "hover:bg-backdrop-1 dark:hover:bg-backdrop-2"}`}
                      onClick={() => update({ ...s, from: s.id, id: undefined })}
                    >
                      <div className="flex-row gap-2 min-w-0">
                        <Mark combo={s} />
                        {current && same(current, s) && <span className="text-[9px] uppercase tracking-widest text-primary shrink-0">brand</span>}
                      </div>
                      <div className="flex-row gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            makeCurrent(s);
                          }}
                          title="Use as the brand (the hub follows immediately)"
                          className={`p-0.5 rounded transition-opacity ${current && same(current, s) ? "text-primary" : "text-main-3 hover:text-primary opacity-0 group-hover/saved:opacity-100"}`}
                        >
                          <Crown className="w-3 h-3" />
                        </button>
                        <div className="text-right text-[10px] text-main-3 leading-tight">
                          <div>{s.font}</div>
                          <div style={{ fontFamily: family(s.body) }}>{s.body}</div>
                        </div>
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ background: s.primary }} />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            commitSaved((l) => l.filter((x) => x.id !== s.id));
                          }}
                          className="p-0.5 rounded text-main-3 hover:text-red-500 opacity-0 group-hover/saved:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {tab === "icon" && (
              <>
                <Toolbar onShuffle={() => update(randomIcon())} hint="Random icon from the curated set">
                  <div className="flex-row gap-1 px-2 py-1 rounded-md bg-backdrop-1 dark:bg-backdrop-2">
                    <Search className="w-3 h-3 text-main-3 shrink-0" />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={`search all ${CATALOG.length.toLocaleString()} game-icons`}
                      className="flex-1 min-w-0 bg-transparent outline-none text-[11px] placeholder:text-main-3"
                    />
                    {query && (
                      <button onClick={() => setQuery("")} className="text-main-3 hover:text-main">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </Toolbar>
                <div className="flex flex-wrap items-center gap-1">
                  {AUTHORS.map((a) => (
                    <button key={a} onClick={() => setAuthor(a)} className={`${CHIP} ${author === a ? CHIP_ON : CHIP_OFF}`}>
                      {a}
                    </button>
                  ))}
                  <span className="ml-auto text-main-3 tabular-nums">{browsing ? results.length.toLocaleString() : PICKS.length} icons</span>
                </div>
                {browsing && results.length === 0 && <div className="text-main-3 py-6 text-center">No icons match</div>}
                <div className="grid grid-cols-8 gap-1">
                  {(browsing ? results : PICKS.map((i) => [i.by, i.name] as [string, string])).map(([by, name]) => (
                    <button
                      key={`${by}/${name}`}
                      onClick={() => update({ icon: name, by })}
                      title={`${name} (${by})`}
                      className={`${CELL} ${saved.icon === name && saved.by === by ? "bg-primary text-white" : "bg-backdrop-1 dark:bg-backdrop-2 text-main hover:text-primary"}`}
                    >
                      <IconSvg by={by} name={name} className="w-5 h-5" />
                    </button>
                  ))}
                </div>
                <div className="flex-row gap-2 pt-1">
                  <span className="text-main-3 w-14">size</span>
                  <input type="range" min={16} max={32} value={saved.size} onChange={(e) => update({ size: Number(e.target.value) })} className="flex-1" />
                  <span className="text-main-3 w-6 text-right tabular-nums">{saved.size}</span>
                </div>
              </>
            )}

            {tab === "font" && (
              <>
                <Toolbar onShuffle={() => update(randomWordmark())} hint="Random font, casing and spacing within this type">
                  <Chips options={groupOpts} value={logoGroup} onChange={setLogoGroup} />
                </Toolbar>
                <Stepper
                  value={saved.font}
                  pool={poolOf(logoGroup)}
                  onChange={(font) => update({ font })}
                  sample={<span className="text-lg leading-none" style={{ fontFamily: family(saved.font), fontWeight: saved.weight }}>{text}</span>}
                />
                <div className="grid grid-cols-[3.5rem_1fr] gap-x-2 gap-y-2 items-center pt-1">
                  <span className="text-main-3">case</span>
                  <Chips options={Object.keys(CASING) as Casing[]} value={saved.casing} onChange={(casing) => update({ casing })} label={(c) => CASING[c]} />
                  <span className="text-main-3">spacing</span>
                  <Chips options={["tight", "normal", "wide"] as Tracking[]} value={saved.tracking} onChange={(tracking) => update({ tracking })} />
                  <span className="text-main-3">weight</span>
                  <Chips options={["400", "500", "600", "700", "800"]} value={String(saved.weight)} onChange={(w) => update({ weight: Number(w) })} />
                </div>
              </>
            )}

            {tab === "body" && (
              <>
                <Toolbar onShuffle={() => update(randomBody())} hint="Random body font within this type">
                  <Chips options={groupOpts} value={bodyGroup} onChange={setBodyGroup} />
                </Toolbar>
                <Stepper
                  value={saved.body}
                  pool={poolOf(bodyGroup)}
                  onChange={(body) => update({ body })}
                  sample={<span className="text-[13px] leading-snug" style={{ fontFamily: family(saved.body) }}>{SAMPLE}</span>}
                />
              </>
            )}

            {tab === "hover" && (
              <>
                <Toolbar onShuffle={() => update(randomHover())} hint="Random hover effect">
                  <span className="text-main-3">Hover each row to preview it on the mark</span>
                </Toolbar>
                <div className="space-y-0.5">
                  {Object.entries(HOVERS).map(([key, h]) => (
                    <button
                      key={key}
                      onClick={() => update({ hover: key })}
                      className={`group w-full flex-between px-2 py-1.5 rounded-md transition-colors ${saved.hover === key ? "bg-primary text-white" : "hover:bg-backdrop-1 dark:hover:bg-backdrop-2"}`}
                    >
                      <span className="flex-row gap-2">
                        <IconSvg by={saved.by} name={saved.icon} className={`w-5 h-5 text-main ${h.cls}`} style={saved.hover === key ? { color: "white" } : undefined} />
                        <span>{h.label}</span>
                      </span>
                      <span className={`text-[10px] ${saved.hover === key ? "text-white/80" : "text-main-3"}`}>{key}</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {tab === "color" && (
              <>
                <Toolbar onShuffle={() => update(randomColor())} hint="Random swatch">
                  <div className="flex-row gap-1.5">
                    <input
                      type="text"
                      defaultValue={saved.primary}
                      key={saved.primary}
                      onChange={(e) => /^#[0-9a-fA-F]{6}$/.test(e.target.value) && update({ primary: e.target.value.toUpperCase() })}
                      className="w-18 px-1.5 py-0.5 rounded-md bg-backdrop-1 dark:bg-backdrop-2 text-[11px] font-mono uppercase outline-none"
                    />
                    <input type="color" value={saved.primary} onChange={(e) => update({ primary: e.target.value.toUpperCase() })} className="w-6 h-6 rounded-md cursor-pointer bg-transparent border-0 p-0" />
                    {PRESET_NAMES[saved.primary] && <span className="text-[10px] text-main-3">{PRESET_NAMES[saved.primary]}</span>}
                  </div>
                </Toolbar>
                <div className="text-main-3">First two rows are flame picks, vermilion through sunflower, named on hover</div>
                <div className="grid grid-cols-12 gap-1">
                  {PRESETS.map((p) => (
                    <button
                      key={p}
                      onClick={() => update({ primary: p })}
                      title={PRESET_NAMES[p] ? `${p} (${PRESET_NAMES[p]})` : p}
                      className={`aspect-square rounded-md transition-transform hover:scale-110 ${saved.primary === p ? "ring-2 ring-offset-2 ring-offset-backdrop dark:ring-offset-backdrop-1 ring-main" : ""}`}
                      style={{ background: p }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
