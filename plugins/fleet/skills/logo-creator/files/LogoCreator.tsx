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

import {
  Inter, Roboto, Open_Sans, Lato, Montserrat, Poppins, Nunito, Nunito_Sans, Raleway, Work_Sans, DM_Sans, Rubik, Karla, Mulish, Cabin, Ubuntu, Source_Sans_3, Fira_Sans, PT_Sans, Noto_Sans, Public_Sans, IBM_Plex_Sans, Figtree, Outfit, Sora, Manrope, Plus_Jakarta_Sans, Lexend, Urbanist, Jost, Josefin_Sans, Archivo, Barlow, Hind, Dosis, Signika, Sen, Quicksand, Varela_Round, Heebo, Assistant, Titillium_Web, Exo_2, Kanit, Prompt, Red_Hat_Display, Red_Hat_Text, Onest, Instrument_Sans, Geist, Syne, Unbounded, Bricolage_Grotesque, Familjen_Grotesk, Gabarito, Funnel_Display, Host_Grotesk, Schibsted_Grotesk, Golos_Text, Hanken_Grotesk, Albert_Sans, Epilogue, Kumbh_Sans, Sofia_Sans, Wix_Madefor_Display, Rethink_Sans, Afacad, Reddit_Sans, Parkinsans, Darker_Grotesque, Space_Grotesk, League_Spartan, Questrial, Montserrat_Alternates, Comfortaa, Fredoka, Baloo_2, Lexend_Zetta, Lexend_Mega, Lexend_Exa, Lexend_Giga, Tilt_Warp, Tilt_Neon, Anta, Bruno_Ace, Bruno_Ace_SC, Tomorrow, Tektur, Kdam_Thmor_Pro, Genos, Trispace, Smooch_Sans, Mohave, Pathway_Extreme, Spinnaker, Telex, Voltaire, Yantramanav, M_PLUS_Rounded_1c, Zen_Kaku_Gothic_New, Dela_Gothic_One, Righteous, Audiowide, Days_One, Monomaniac_One, Concert_One, Lilita_One, Paytone_One, Bowlby_One, Bowlby_One_SC, Racing_Sans_One, Krona_One, Goldman, Iceberg, Turret_Road, Sarpanch, Fugaz_One, Chango, Contrail_One, Boogaloo, Sansita, Sniglet, Shrikhand, Titan_One, Rowdies, Bagel_Fat_One, Gasoek_One, Bangers, Luckiest_Guy, Alfa_Slab_One, Ultra, Rammetto_One, Rubik_Mono_One, Black_Ops_One, Bungee, Passion_One, Squada_One, Russo_One, Poller_One, Jockey_One, Marvel, Homenaje, Geo, Rationale, Strait, Economica, Share, Share_Tech, Limelight, Poiret_One, Abril_Fatface, Yeseva_One, Lobster, Pacifico, Kaushan_Script, Permanent_Marker, Protest_Strike, Protest_Riot, Chonburi, Cherry_Bomb_One, Mochiy_Pop_One, Jaro, Climate_Crisis, Foldit, Faster_One, Wallpoet, Syncopate, Major_Mono_Display, Bungee_Shade, Bungee_Inline, Monoton, Orbitron, Michroma, Chakra_Petch, Oxanium, Quantico, Aldrich, Electrolize, Jura, Nova_Square, Nova_Flat, Nova_Round, Play, Saira, Rajdhani, Bai_Jamjuree, Advent_Pro, Gruppo, Stick_No_Bills, Sono, Exo, Zen_Dots, Tourney, Krub, Mitr, Niramit, Grandstander, Playfair_Display, Merriweather, Lora, Roboto_Slab, Bitter, Zilla_Slab, Arvo, Libre_Baskerville, DM_Serif_Display, Fraunces, Instrument_Serif, Young_Serif, Newsreader, Spectral, Crimson_Pro, EB_Garamond, Cardo, Alegreya, Bodoni_Moda, Italiana, Marcellus, Forum, Julius_Sans_One, Cinzel, Cinzel_Decorative, Cormorant_Garamond, Josefin_Slab, Noto_Serif, Source_Serif_4, Domine, Vollkorn, Prata, Gloock, Bevan, Oswald, Bebas_Neue, Anton, Anton_SC, Antonio, Teko, Archivo_Black, Archivo_Narrow, Barlow_Condensed, Barlow_Semi_Condensed, Saira_Condensed, Sofia_Sans_Condensed, Fjalla_One, Pathway_Gothic_One, League_Gothic, Roboto_Condensed, Fira_Sans_Condensed, Ubuntu_Condensed, Encode_Sans_Condensed, Yanone_Kaffeesatz, Khand, Pragati_Narrow, Six_Caps, Staatliches, Bungee_Hairline, Space_Mono, JetBrains_Mono, Geist_Mono, Martian_Mono, IBM_Plex_Mono, Roboto_Mono, Fira_Code, Source_Code_Pro, DM_Mono, Azeret_Mono, Sometype_Mono, Red_Hat_Mono, Chivo_Mono, Spline_Sans_Mono, Nova_Mono, Share_Tech_Mono, Xanh_Mono, Kode_Mono, Ubuntu_Mono, Courier_Prime, Inconsolata, Overpass_Mono, Cutive_Mono, Syne_Mono, Fragment_Mono, B612_Mono, Unica_One, Federo, Megrim, Kenia, Revalia, Stalinist_One, Bungee_Outline, Rubik_Iso, Rubik_80s_Fade, Rubik_Vinyl, Rubik_Moonrocks, Rubik_Lines, Rubik_Glitch, Rubik_Maze, Saira_Stencil_One, Allerta_Stencil, Stardos_Stencil, Sirin_Stencil, Emblema_One, Codystar, Ropa_Sans, Prosto_One, Kelly_Slab, Sansation, Iceland, Nova_Oval, Nova_Cut, Nova_Script, Nova_Slim, Lobster_Two, Dancing_Script, Great_Vibes, Satisfy, Cookie, Courgette, Sacramento, Yellowtail, Allura, Alex_Brush, Parisienne, Tangerine, Pinyon_Script, Mr_Dafoe, Norican, Oleo_Script, Oleo_Script_Swash_Caps, Sansita_Swashed, Berkshire_Swash, Playball, Damion, Marck_Script, Caveat, Shadows_Into_Light, Indie_Flower, Amatic_SC, Rock_Salt, Homemade_Apple, Nothing_You_Could_Do, Reenie_Beanie, Covered_By_Your_Grace, Gloria_Hallelujah, Architects_Daughter, Patrick_Hand, Kalam, Handlee, Neucha, Comic_Neue, Bad_Script, Merienda, Niconne, Rochester, Rouge_Script, Herr_Von_Muellerhoff, Monsieur_La_Doulaise, Mrs_Saint_Delafield, Italianno, Grand_Hotel, Lily_Script_One, Leckerli_One, Style_Script, Cherish, Carattere, Caramel, Ephesis, Ms_Madi, Send_Flowers, Splash, Water_Brush, Whisper, Ballet, Birthstone, Bonheur_Royale, Corinthia, Estonia, Hurricane, Imperial_Script, Inspiration, Island_Moments, Kolker_Brush, Lavishly_Yours, Love_Light, Luxurious_Script, Meow_Script, Moon_Dance, Mea_Culpa, Neonderthaw, Oooh_Baby, Passions_Conflict, Petemoss, Puppies_Play, Qwitcher_Grypen, Sassy_Frass, Smooch, Square_Peg, Tapestry, The_Nautigal, Twinkle_Star, Updock, Vujahday_Script, Waterfall, Comforter, Comforter_Brush, Explora, Festive, Gwendolyn, Licorice, Mrs_Sheppards, My_Soul, Praise, Babylonica, Beau_Rivage, Fuggles, Charm, Charmonman, Mali, Itim, Sriracha, Pattaya, Sofia, Euphoria_Script, Clicker_Script, Engagement, Kristi, La_Belle_Aurore, Meddon, Over_the_Rainbow, Sue_Ellen_Francisco, Zeyada, Cedarville_Cursive, Dawning_of_a_New_Day, Give_You_Glory, Just_Me_Again_Down_Here, Loved_by_the_King, Waiting_for_the_Sunrise, Calligraffitti, Coming_Soon, Crafty_Girls, Delius, Delius_Swash_Caps, Gochi_Hand, Just_Another_Hand, Schoolbell, Short_Stack, Sunshiney, Swanky_and_Moo_Moo, Walter_Turncoat, Annie_Use_Your_Telescope, Chilanka, Gaegu, Nanum_Pen_Script, Nanum_Brush_Script, Hi_Melody, Dokdo, East_Sea_Dokdo, Gamja_Flower, Poor_Story, Yeon_Sung, Cute_Font, Do_Hyeon, Jua, Kirang_Haerang, Black_Han_Sans, Black_And_White_Picture, Gugi, Hahmlet, Gowun_Dodum, Gowun_Batang, Nanum_Gothic, Nanum_Myeongjo, Noto_Sans_KR, Rye, Vast_Shadow, Chewy, Ranchers, Londrina_Solid, Londrina_Shadow, Londrina_Outline, Londrina_Sketch, Fredericka_the_Great, Modak, Kavoon, Lemon, Cherry_Cream_Soda, Frijole, Knewave, Original_Surfer, Sonsie_One, Spicy_Rice, Ribeye, Ribeye_Marrow, Sedgwick_Ave, Sedgwick_Ave_Display, Slackey, Trade_Winds, Freckle_Face, Fontdiner_Swanky, Henny_Penny, Nixie_One, Elsie, Mystery_Quest, Protest_Revolution, Protest_Guerrilla, Alumni_Sans, Alumni_Sans_Collegiate_One, Alumni_Sans_Inline_One, Alumni_Sans_Pinstripe, Graduate, Carter_One, Coda, Coiny, Fascinate, Fascinate_Inline, Flavors, Galindo, Gorditas, Hanalei, Hanalei_Fill, Joti_One, Kumar_One, Kumar_One_Outline, Lakki_Reddy, Margarine, Metal_Mania, Miltonian, Miltonian_Tattoo, Moul, Mouse_Memoirs, New_Rocker, Nosifer, Piedra, Pirata_One, Sancreek, Sarina, Shojumaru, Smokum, Snowburst_One, Stint_Ultra_Expanded, Stint_Ultra_Condensed, Supermercado_One, Trochut, Unkempt, Wendy_One, Zilla_Slab_Highlight, Reggae_One, RocknRoll_One, Rampart_One, Stick, Train_One, Yusei_Magic, Kaisei_Opti, Kaisei_Decol, Kaisei_HarunoUmi, Kaisei_Tokumin, Potta_One, Hachi_Maru_Pop, Yomogi, Zen_Antique, Zen_Kurenaido, Zen_Loop, Zen_Maru_Gothic, Zen_Old_Mincho, Klee_One, Shippori_Antique, Shippori_Antique_B1, Mochiy_Pop_P_One, Murecho, M_PLUS_1, M_PLUS_2, M_PLUS_1_Code, BIZ_UDPGothic, BIZ_UDPMincho, Kosugi, Kosugi_Maru, Sawarabi_Gothic, Sawarabi_Mincho, Hina_Mincho, Yuji_Boku, Yuji_Mai, Yuji_Syuku, Yuji_Hentaigana_Akari, Yuji_Hentaigana_Akebono,
} from "next/font/google";

const inter = Inter({ subsets: ["latin"] });
const roboto = Roboto({ subsets: ["latin"] });
const openSans = Open_Sans({ subsets: ["latin"] });
const lato = Lato({ subsets: ["latin"], weight: ["400", "700", "900"] });
const montserrat = Montserrat({ subsets: ["latin"] });
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800", "900"] });
const nunito = Nunito({ subsets: ["latin"] });
const nunitoSans = Nunito_Sans({ subsets: ["latin"] });
const raleway = Raleway({ subsets: ["latin"] });
const workSans = Work_Sans({ subsets: ["latin"] });
const dMSans = DM_Sans({ subsets: ["latin"] });
const rubik = Rubik({ subsets: ["latin"] });
const karla = Karla({ subsets: ["latin"] });
const mulish = Mulish({ subsets: ["latin"] });
const cabin = Cabin({ subsets: ["latin"] });
const ubuntu = Ubuntu({ subsets: ["latin"], weight: ["400", "500", "700"] });
const sourceSans3 = Source_Sans_3({ subsets: ["latin"] });
const firaSans = Fira_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800", "900"] });
const pTSans = PT_Sans({ subsets: ["latin"], weight: ["400", "700"] });
const notoSans = Noto_Sans({ subsets: ["latin"] });
const publicSans = Public_Sans({ subsets: ["latin"] });
const iBMPlexSans = IBM_Plex_Sans({ subsets: ["latin"] });
const figtree = Figtree({ subsets: ["latin"] });
const outfit = Outfit({ subsets: ["latin"] });
const sora = Sora({ subsets: ["latin"] });
const manrope = Manrope({ subsets: ["latin"] });
const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ["latin"] });
const lexend = Lexend({ subsets: ["latin"] });
const urbanist = Urbanist({ subsets: ["latin"] });
const jost = Jost({ subsets: ["latin"] });
const josefinSans = Josefin_Sans({ subsets: ["latin"] });
const archivo = Archivo({ subsets: ["latin"] });
const barlow = Barlow({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800", "900"] });
const hind = Hind({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const dosis = Dosis({ subsets: ["latin"] });
const signika = Signika({ subsets: ["latin"] });
const sen = Sen({ subsets: ["latin"] });
const quicksand = Quicksand({ subsets: ["latin"] });
const varelaRound = Varela_Round({ subsets: ["latin"], weight: "400" });
const heebo = Heebo({ subsets: ["latin"] });
const assistant = Assistant({ subsets: ["latin"] });
const titilliumWeb = Titillium_Web({ subsets: ["latin"], weight: ["400", "600", "700", "900"] });
const exo2 = Exo_2({ subsets: ["latin"] });
const kanit = Kanit({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800", "900"] });
const prompt = Prompt({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800", "900"] });
const redHatDisplay = Red_Hat_Display({ subsets: ["latin"] });
const redHatText = Red_Hat_Text({ subsets: ["latin"] });
const onest = Onest({ subsets: ["latin"] });
const instrumentSans = Instrument_Sans({ subsets: ["latin"] });
const geist = Geist({ subsets: ["latin"] });
const syne = Syne({ subsets: ["latin"] });
const unbounded = Unbounded({ subsets: ["latin"] });
const bricolageGrotesque = Bricolage_Grotesque({ subsets: ["latin"] });
const familjenGrotesk = Familjen_Grotesk({ subsets: ["latin"] });
const gabarito = Gabarito({ subsets: ["latin"] });
const funnelDisplay = Funnel_Display({ subsets: ["latin"] });
const hostGrotesk = Host_Grotesk({ subsets: ["latin"] });
const schibstedGrotesk = Schibsted_Grotesk({ subsets: ["latin"] });
const golosText = Golos_Text({ subsets: ["latin"] });
const hankenGrotesk = Hanken_Grotesk({ subsets: ["latin"] });
const albertSans = Albert_Sans({ subsets: ["latin"] });
const epilogue = Epilogue({ subsets: ["latin"] });
const kumbhSans = Kumbh_Sans({ subsets: ["latin"] });
const sofiaSans = Sofia_Sans({ subsets: ["latin"] });
const wixMadeforDisplay = Wix_Madefor_Display({ subsets: ["latin"] });
const rethinkSans = Rethink_Sans({ subsets: ["latin"] });
const afacad = Afacad({ subsets: ["latin"] });
const redditSans = Reddit_Sans({ subsets: ["latin"] });
const parkinsans = Parkinsans({ subsets: ["latin"] });
const darkerGrotesque = Darker_Grotesque({ subsets: ["latin"] });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"] });
const leagueSpartan = League_Spartan({ subsets: ["latin"] });
const questrial = Questrial({ subsets: ["latin"], weight: "400" });
const montserratAlternates = Montserrat_Alternates({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800", "900"] });
const comfortaa = Comfortaa({ subsets: ["latin"] });
const fredoka = Fredoka({ subsets: ["latin"] });
const baloo2 = Baloo_2({ subsets: ["latin"] });
const lexendZetta = Lexend_Zetta({ subsets: ["latin"] });
const lexendMega = Lexend_Mega({ subsets: ["latin"] });
const lexendExa = Lexend_Exa({ subsets: ["latin"] });
const lexendGiga = Lexend_Giga({ subsets: ["latin"] });
const tiltWarp = Tilt_Warp({ subsets: ["latin"] });
const tiltNeon = Tilt_Neon({ subsets: ["latin"] });
const anta = Anta({ subsets: ["latin"], weight: "400" });
const brunoAce = Bruno_Ace({ subsets: ["latin"], weight: "400" });
const brunoAceSC = Bruno_Ace_SC({ subsets: ["latin"], weight: "400" });
const tomorrow = Tomorrow({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800", "900"] });
const tektur = Tektur({ subsets: ["latin"] });
const kdamThmorPro = Kdam_Thmor_Pro({ subsets: ["latin"], weight: "400" });
const genos = Genos({ subsets: ["latin"] });
const trispace = Trispace({ subsets: ["latin"] });
const smoochSans = Smooch_Sans({ subsets: ["latin"] });
const mohave = Mohave({ subsets: ["latin"] });
const pathwayExtreme = Pathway_Extreme({ subsets: ["latin"] });
const spinnaker = Spinnaker({ subsets: ["latin"], weight: "400" });
const telex = Telex({ subsets: ["latin"], weight: "400" });
const voltaire = Voltaire({ subsets: ["latin"], weight: "400" });
const yantramanav = Yantramanav({ subsets: ["latin"], weight: ["400", "500", "700", "900"] });
const mPLUSRounded1c = M_PLUS_Rounded_1c({ subsets: ["latin"], weight: ["400", "500", "700", "800", "900"] });
const zenKakuGothicNew = Zen_Kaku_Gothic_New({ subsets: ["latin"], weight: ["400", "500", "700", "900"] });
const delaGothicOne = Dela_Gothic_One({ subsets: ["latin"], weight: "400" });
const righteous = Righteous({ subsets: ["latin"], weight: "400" });
const audiowide = Audiowide({ subsets: ["latin"], weight: "400" });
const daysOne = Days_One({ subsets: ["latin"], weight: "400" });
const monomaniacOne = Monomaniac_One({ subsets: ["latin"], weight: "400" });
const concertOne = Concert_One({ subsets: ["latin"], weight: "400" });
const lilitaOne = Lilita_One({ subsets: ["latin"], weight: "400" });
const paytoneOne = Paytone_One({ subsets: ["latin"], weight: "400" });
const bowlbyOne = Bowlby_One({ subsets: ["latin"], weight: "400" });
const bowlbyOneSC = Bowlby_One_SC({ subsets: ["latin"], weight: "400" });
const racingSansOne = Racing_Sans_One({ subsets: ["latin"], weight: "400" });
const kronaOne = Krona_One({ subsets: ["latin"], weight: "400" });
const goldman = Goldman({ subsets: ["latin"], weight: ["400", "700"] });
const iceberg = Iceberg({ subsets: ["latin"], weight: "400" });
const turretRoad = Turret_Road({ subsets: ["latin"], weight: ["400", "500", "700", "800"] });
const sarpanch = Sarpanch({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800", "900"] });
const fugazOne = Fugaz_One({ subsets: ["latin"], weight: "400" });
const chango = Chango({ subsets: ["latin"], weight: "400" });
const contrailOne = Contrail_One({ subsets: ["latin"], weight: "400" });
const boogaloo = Boogaloo({ subsets: ["latin"], weight: "400" });
const sansita = Sansita({ subsets: ["latin"], weight: ["400", "700", "800", "900"] });
const sniglet = Sniglet({ subsets: ["latin"], weight: ["400", "800"] });
const shrikhand = Shrikhand({ subsets: ["latin"], weight: "400" });
const titanOne = Titan_One({ subsets: ["latin"], weight: "400" });
const rowdies = Rowdies({ subsets: ["latin"], weight: ["400", "700"] });
const bagelFatOne = Bagel_Fat_One({ subsets: ["latin"], weight: "400" });
const gasoekOne = Gasoek_One({ subsets: ["latin"], weight: "400" });
const bangers = Bangers({ subsets: ["latin"], weight: "400" });
const luckiestGuy = Luckiest_Guy({ subsets: ["latin"], weight: "400" });
const alfaSlabOne = Alfa_Slab_One({ subsets: ["latin"], weight: "400" });
const ultra = Ultra({ subsets: ["latin"], weight: "400" });
const rammettoOne = Rammetto_One({ subsets: ["latin"], weight: "400" });
const rubikMonoOne = Rubik_Mono_One({ subsets: ["latin"], weight: "400" });
const blackOpsOne = Black_Ops_One({ subsets: ["latin"], weight: "400" });
const bungee = Bungee({ subsets: ["latin"], weight: "400" });
const passionOne = Passion_One({ subsets: ["latin"], weight: ["400", "700", "900"] });
const squadaOne = Squada_One({ subsets: ["latin"], weight: "400" });
const russoOne = Russo_One({ subsets: ["latin"], weight: "400" });
const pollerOne = Poller_One({ subsets: ["latin"], weight: "400" });
const jockeyOne = Jockey_One({ subsets: ["latin"], weight: "400" });
const marvel = Marvel({ subsets: ["latin"], weight: ["400", "700"] });
const homenaje = Homenaje({ subsets: ["latin"], weight: "400" });
const geo = Geo({ subsets: ["latin"], weight: "400" });
const rationale = Rationale({ subsets: ["latin"], weight: "400" });
const strait = Strait({ subsets: ["latin"], weight: "400" });
const economica = Economica({ subsets: ["latin"], weight: ["400", "700"] });
const share = Share({ subsets: ["latin"], weight: ["400", "700"] });
const shareTech = Share_Tech({ subsets: ["latin"], weight: "400" });
const limelight = Limelight({ subsets: ["latin"], weight: "400" });
const poiretOne = Poiret_One({ subsets: ["latin"], weight: "400" });
const abrilFatface = Abril_Fatface({ subsets: ["latin"], weight: "400" });
const yesevaOne = Yeseva_One({ subsets: ["latin"], weight: "400" });
const lobster = Lobster({ subsets: ["latin"], weight: "400" });
const pacifico = Pacifico({ subsets: ["latin"], weight: "400" });
const kaushanScript = Kaushan_Script({ subsets: ["latin"], weight: "400" });
const permanentMarker = Permanent_Marker({ subsets: ["latin"], weight: "400" });
const protestStrike = Protest_Strike({ subsets: ["latin"], weight: "400" });
const protestRiot = Protest_Riot({ subsets: ["latin"], weight: "400" });
const chonburi = Chonburi({ subsets: ["latin"], weight: "400" });
const cherryBombOne = Cherry_Bomb_One({ subsets: ["latin"], weight: "400" });
const mochiyPopOne = Mochiy_Pop_One({ subsets: ["latin"], weight: "400" });
const jaro = Jaro({ subsets: ["latin"] });
const climateCrisis = Climate_Crisis({ subsets: ["latin"] });
const foldit = Foldit({ subsets: ["latin"] });
const fasterOne = Faster_One({ subsets: ["latin"], weight: "400" });
const wallpoet = Wallpoet({ subsets: ["latin"], weight: "400" });
const syncopate = Syncopate({ subsets: ["latin"], weight: ["400", "700"] });
const majorMonoDisplay = Major_Mono_Display({ subsets: ["latin"], weight: "400" });
const bungeeShade = Bungee_Shade({ subsets: ["latin"], weight: "400" });
const bungeeInline = Bungee_Inline({ subsets: ["latin"], weight: "400" });
const monoton = Monoton({ subsets: ["latin"], weight: "400" });
const orbitron = Orbitron({ subsets: ["latin"] });
const michroma = Michroma({ subsets: ["latin"], weight: "400" });
const chakraPetch = Chakra_Petch({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const oxanium = Oxanium({ subsets: ["latin"] });
const quantico = Quantico({ subsets: ["latin"], weight: ["400", "700"] });
const aldrich = Aldrich({ subsets: ["latin"], weight: "400" });
const electrolize = Electrolize({ subsets: ["latin"], weight: "400" });
const jura = Jura({ subsets: ["latin"] });
const novaSquare = Nova_Square({ subsets: ["latin"], weight: "400" });
const novaFlat = Nova_Flat({ subsets: ["latin"], weight: "400" });
const novaRound = Nova_Round({ subsets: ["latin"], weight: "400" });
const play = Play({ subsets: ["latin"], weight: ["400", "700"] });
const saira = Saira({ subsets: ["latin"] });
const rajdhani = Rajdhani({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const baiJamjuree = Bai_Jamjuree({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const adventPro = Advent_Pro({ subsets: ["latin"] });
const gruppo = Gruppo({ subsets: ["latin"], weight: "400" });
const stickNoBills = Stick_No_Bills({ subsets: ["latin"] });
const sono = Sono({ subsets: ["latin"] });
const exo = Exo({ subsets: ["latin"] });
const zenDots = Zen_Dots({ subsets: ["latin"], weight: "400" });
const tourney = Tourney({ subsets: ["latin"] });
const krub = Krub({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const mitr = Mitr({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const niramit = Niramit({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const grandstander = Grandstander({ subsets: ["latin"] });
const playfairDisplay = Playfair_Display({ subsets: ["latin"] });
const merriweather = Merriweather({ subsets: ["latin"] });
const lora = Lora({ subsets: ["latin"] });
const robotoSlab = Roboto_Slab({ subsets: ["latin"] });
const bitter = Bitter({ subsets: ["latin"] });
const zillaSlab = Zilla_Slab({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const arvo = Arvo({ subsets: ["latin"], weight: ["400", "700"] });
const libreBaskerville = Libre_Baskerville({ subsets: ["latin"] });
const dMSerifDisplay = DM_Serif_Display({ subsets: ["latin"], weight: "400" });
const fraunces = Fraunces({ subsets: ["latin"] });
const instrumentSerif = Instrument_Serif({ subsets: ["latin"], weight: "400" });
const youngSerif = Young_Serif({ subsets: ["latin"], weight: "400" });
const newsreader = Newsreader({ subsets: ["latin"] });
const spectral = Spectral({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });
const crimsonPro = Crimson_Pro({ subsets: ["latin"] });
const eBGaramond = EB_Garamond({ subsets: ["latin"] });
const cardo = Cardo({ subsets: ["latin"], weight: ["400", "700"] });
const alegreya = Alegreya({ subsets: ["latin"] });
const bodoniModa = Bodoni_Moda({ subsets: ["latin"] });
const italiana = Italiana({ subsets: ["latin"], weight: "400" });
const marcellus = Marcellus({ subsets: ["latin"], weight: "400" });
const forum = Forum({ subsets: ["latin"], weight: "400" });
const juliusSansOne = Julius_Sans_One({ subsets: ["latin"], weight: "400" });
const cinzel = Cinzel({ subsets: ["latin"] });
const cinzelDecorative = Cinzel_Decorative({ subsets: ["latin"], weight: ["400", "700", "900"] });
const cormorantGaramond = Cormorant_Garamond({ subsets: ["latin"] });
const josefinSlab = Josefin_Slab({ subsets: ["latin"] });
const notoSerif = Noto_Serif({ subsets: ["latin"] });
const sourceSerif4 = Source_Serif_4({ subsets: ["latin"] });
const domine = Domine({ subsets: ["latin"] });
const vollkorn = Vollkorn({ subsets: ["latin"] });
const prata = Prata({ subsets: ["latin"], weight: "400" });
const gloock = Gloock({ subsets: ["latin"], weight: "400" });
const bevan = Bevan({ subsets: ["latin"], weight: "400" });
const oswald = Oswald({ subsets: ["latin"] });
const bebasNeue = Bebas_Neue({ subsets: ["latin"], weight: "400" });
const anton = Anton({ subsets: ["latin"], weight: "400" });
const antonSC = Anton_SC({ subsets: ["latin"], weight: "400" });
const antonio = Antonio({ subsets: ["latin"] });
const teko = Teko({ subsets: ["latin"] });
const archivoBlack = Archivo_Black({ subsets: ["latin"], weight: "400" });
const archivoNarrow = Archivo_Narrow({ subsets: ["latin"] });
const barlowCondensed = Barlow_Condensed({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800", "900"] });
const barlowSemiCondensed = Barlow_Semi_Condensed({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800", "900"] });
const sairaCondensed = Saira_Condensed({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800", "900"] });
const sofiaSansCondensed = Sofia_Sans_Condensed({ subsets: ["latin"] });
const fjallaOne = Fjalla_One({ subsets: ["latin"], weight: "400" });
const pathwayGothicOne = Pathway_Gothic_One({ subsets: ["latin"], weight: "400" });
const leagueGothic = League_Gothic({ subsets: ["latin"] });
const robotoCondensed = Roboto_Condensed({ subsets: ["latin"] });
const firaSansCondensed = Fira_Sans_Condensed({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800", "900"] });
const ubuntuCondensed = Ubuntu_Condensed({ subsets: ["latin"], weight: "400" });
const encodeSansCondensed = Encode_Sans_Condensed({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800", "900"] });
const yanoneKaffeesatz = Yanone_Kaffeesatz({ subsets: ["latin"] });
const khand = Khand({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const pragatiNarrow = Pragati_Narrow({ subsets: ["latin"], weight: ["400", "700"] });
const sixCaps = Six_Caps({ subsets: ["latin"], weight: "400" });
const staatliches = Staatliches({ subsets: ["latin"], weight: "400" });
const bungeeHairline = Bungee_Hairline({ subsets: ["latin"], weight: "400" });
const spaceMono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"] });
const jetBrainsMono = JetBrains_Mono({ subsets: ["latin"] });
const geistMono = Geist_Mono({ subsets: ["latin"] });
const martianMono = Martian_Mono({ subsets: ["latin"] });
const iBMPlexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const robotoMono = Roboto_Mono({ subsets: ["latin"] });
const firaCode = Fira_Code({ subsets: ["latin"] });
const sourceCodePro = Source_Code_Pro({ subsets: ["latin"] });
const dMMono = DM_Mono({ subsets: ["latin"], weight: ["400", "500"] });
const azeretMono = Azeret_Mono({ subsets: ["latin"] });
const sometypeMono = Sometype_Mono({ subsets: ["latin"] });
const redHatMono = Red_Hat_Mono({ subsets: ["latin"] });
const chivoMono = Chivo_Mono({ subsets: ["latin"] });
const splineSansMono = Spline_Sans_Mono({ subsets: ["latin"] });
const novaMono = Nova_Mono({ subsets: ["latin"], weight: "400" });
const shareTechMono = Share_Tech_Mono({ subsets: ["latin"], weight: "400" });
const xanhMono = Xanh_Mono({ subsets: ["latin"], weight: "400" });
const kodeMono = Kode_Mono({ subsets: ["latin"] });
const ubuntuMono = Ubuntu_Mono({ subsets: ["latin"], weight: ["400", "700"] });
const courierPrime = Courier_Prime({ subsets: ["latin"], weight: ["400", "700"] });
const inconsolata = Inconsolata({ subsets: ["latin"] });
const overpassMono = Overpass_Mono({ subsets: ["latin"] });
const cutiveMono = Cutive_Mono({ subsets: ["latin"], weight: "400" });
const syneMono = Syne_Mono({ subsets: ["latin"], weight: "400" });
const fragmentMono = Fragment_Mono({ subsets: ["latin"], weight: "400" });
const b612Mono = B612_Mono({ subsets: ["latin"], weight: ["400", "700"] });
const unicaOne = Unica_One({ subsets: ["latin"], weight: "400" });
const federo = Federo({ subsets: ["latin"], weight: "400" });
const megrim = Megrim({ subsets: ["latin"], weight: "400" });
const kenia = Kenia({ subsets: ["latin"], weight: "400" });
const revalia = Revalia({ subsets: ["latin"], weight: "400" });
const stalinistOne = Stalinist_One({ subsets: ["latin"], weight: "400" });
const bungeeOutline = Bungee_Outline({ subsets: ["latin"], weight: "400" });
const rubikIso = Rubik_Iso({ subsets: ["latin"], weight: "400" });
const rubik80sFade = Rubik_80s_Fade({ subsets: ["latin"], weight: "400" });
const rubikVinyl = Rubik_Vinyl({ subsets: ["latin"], weight: "400" });
const rubikMoonrocks = Rubik_Moonrocks({ subsets: ["latin"], weight: "400" });
const rubikLines = Rubik_Lines({ subsets: ["latin"], weight: "400" });
const rubikGlitch = Rubik_Glitch({ subsets: ["latin"], weight: "400" });
const rubikMaze = Rubik_Maze({ subsets: ["latin"], weight: "400" });
const sairaStencilOne = Saira_Stencil_One({ subsets: ["latin"], weight: "400" });
const allertaStencil = Allerta_Stencil({ subsets: ["latin"], weight: "400" });
const stardosStencil = Stardos_Stencil({ subsets: ["latin"], weight: ["400", "700"] });
const sirinStencil = Sirin_Stencil({ subsets: ["latin"], weight: "400" });
const emblemaOne = Emblema_One({ subsets: ["latin"], weight: "400" });
const codystar = Codystar({ subsets: ["latin"], weight: "400" });
const ropaSans = Ropa_Sans({ subsets: ["latin"], weight: "400" });
const prostoOne = Prosto_One({ subsets: ["latin"], weight: "400" });
const kellySlab = Kelly_Slab({ subsets: ["latin"], weight: "400" });
const sansation = Sansation({ subsets: ["latin"], weight: ["400", "700"] });
const iceland = Iceland({ subsets: ["latin"], weight: "400" });
const novaOval = Nova_Oval({ subsets: ["latin"], weight: "400" });
const novaCut = Nova_Cut({ subsets: ["latin"], weight: "400" });
const novaScript = Nova_Script({ subsets: ["latin"], weight: "400" });
const novaSlim = Nova_Slim({ subsets: ["latin"], weight: "400" });
const lobsterTwo = Lobster_Two({ subsets: ["latin"], weight: ["400", "700"] });
const dancingScript = Dancing_Script({ subsets: ["latin"] });
const greatVibes = Great_Vibes({ subsets: ["latin"], weight: "400" });
const satisfy = Satisfy({ subsets: ["latin"], weight: "400" });
const cookie = Cookie({ subsets: ["latin"], weight: "400" });
const courgette = Courgette({ subsets: ["latin"], weight: "400" });
const sacramento = Sacramento({ subsets: ["latin"], weight: "400" });
const yellowtail = Yellowtail({ subsets: ["latin"], weight: "400" });
const allura = Allura({ subsets: ["latin"], weight: "400" });
const alexBrush = Alex_Brush({ subsets: ["latin"], weight: "400" });
const parisienne = Parisienne({ subsets: ["latin"], weight: "400" });
const tangerine = Tangerine({ subsets: ["latin"], weight: ["400", "700"] });
const pinyonScript = Pinyon_Script({ subsets: ["latin"], weight: "400" });
const mrDafoe = Mr_Dafoe({ subsets: ["latin"], weight: "400" });
const norican = Norican({ subsets: ["latin"], weight: "400" });
const oleoScript = Oleo_Script({ subsets: ["latin"], weight: ["400", "700"] });
const oleoScriptSwashCaps = Oleo_Script_Swash_Caps({ subsets: ["latin"], weight: ["400", "700"] });
const sansitaSwashed = Sansita_Swashed({ subsets: ["latin"] });
const berkshireSwash = Berkshire_Swash({ subsets: ["latin"], weight: "400" });
const playball = Playball({ subsets: ["latin"], weight: "400" });
const damion = Damion({ subsets: ["latin"], weight: "400" });
const marckScript = Marck_Script({ subsets: ["latin"], weight: "400" });
const caveat = Caveat({ subsets: ["latin"] });
const shadowsIntoLight = Shadows_Into_Light({ subsets: ["latin"], weight: "400" });
const indieFlower = Indie_Flower({ subsets: ["latin"], weight: "400" });
const amaticSC = Amatic_SC({ subsets: ["latin"], weight: ["400", "700"] });
const rockSalt = Rock_Salt({ subsets: ["latin"], weight: "400" });
const homemadeApple = Homemade_Apple({ subsets: ["latin"], weight: "400" });
const nothingYouCouldDo = Nothing_You_Could_Do({ subsets: ["latin"], weight: "400" });
const reenieBeanie = Reenie_Beanie({ subsets: ["latin"], weight: "400" });
const coveredByYourGrace = Covered_By_Your_Grace({ subsets: ["latin"], weight: "400" });
const gloriaHallelujah = Gloria_Hallelujah({ subsets: ["latin"], weight: "400" });
const architectsDaughter = Architects_Daughter({ subsets: ["latin"], weight: "400" });
const patrickHand = Patrick_Hand({ subsets: ["latin"], weight: "400" });
const kalam = Kalam({ subsets: ["latin"], weight: ["400", "700"] });
const handlee = Handlee({ subsets: ["latin"], weight: "400" });
const neucha = Neucha({ subsets: ["latin"], weight: "400" });
const comicNeue = Comic_Neue({ subsets: ["latin"], weight: ["400", "700"] });
const badScript = Bad_Script({ subsets: ["latin"], weight: "400" });
const merienda = Merienda({ subsets: ["latin"] });
const niconne = Niconne({ subsets: ["latin"], weight: "400" });
const rochester = Rochester({ subsets: ["latin"], weight: "400" });
const rougeScript = Rouge_Script({ subsets: ["latin"], weight: "400" });
const herrVonMuellerhoff = Herr_Von_Muellerhoff({ subsets: ["latin"], weight: "400" });
const monsieurLaDoulaise = Monsieur_La_Doulaise({ subsets: ["latin"], weight: "400" });
const mrsSaintDelafield = Mrs_Saint_Delafield({ subsets: ["latin"], weight: "400" });
const italianno = Italianno({ subsets: ["latin"], weight: "400" });
const grandHotel = Grand_Hotel({ subsets: ["latin"], weight: "400" });
const lilyScriptOne = Lily_Script_One({ subsets: ["latin"], weight: "400" });
const leckerliOne = Leckerli_One({ subsets: ["latin"], weight: "400" });
const styleScript = Style_Script({ subsets: ["latin"], weight: "400" });
const cherish = Cherish({ subsets: ["latin"], weight: "400" });
const carattere = Carattere({ subsets: ["latin"], weight: "400" });
const caramel = Caramel({ subsets: ["latin"], weight: "400" });
const ephesis = Ephesis({ subsets: ["latin"], weight: "400" });
const msMadi = Ms_Madi({ subsets: ["latin"], weight: "400" });
const sendFlowers = Send_Flowers({ subsets: ["latin"], weight: "400" });
const splash = Splash({ subsets: ["latin"], weight: "400" });
const waterBrush = Water_Brush({ subsets: ["latin"], weight: "400" });
const whisper = Whisper({ subsets: ["latin"], weight: "400" });
const ballet = Ballet({ subsets: ["latin"] });
const birthstone = Birthstone({ subsets: ["latin"], weight: "400" });
const bonheurRoyale = Bonheur_Royale({ subsets: ["latin"], weight: "400" });
const corinthia = Corinthia({ subsets: ["latin"], weight: ["400", "700"] });
const estonia = Estonia({ subsets: ["latin"], weight: "400" });
const hurricane = Hurricane({ subsets: ["latin"], weight: "400" });
const imperialScript = Imperial_Script({ subsets: ["latin"], weight: "400" });
const inspiration = Inspiration({ subsets: ["latin"], weight: "400" });
const islandMoments = Island_Moments({ subsets: ["latin"], weight: "400" });
const kolkerBrush = Kolker_Brush({ subsets: ["latin"], weight: "400" });
const lavishlyYours = Lavishly_Yours({ subsets: ["latin"], weight: "400" });
const loveLight = Love_Light({ subsets: ["latin"], weight: "400" });
const luxuriousScript = Luxurious_Script({ subsets: ["latin"], weight: "400" });
const meowScript = Meow_Script({ subsets: ["latin"], weight: "400" });
const moonDance = Moon_Dance({ subsets: ["latin"], weight: "400" });
const meaCulpa = Mea_Culpa({ subsets: ["latin"], weight: "400" });
const neonderthaw = Neonderthaw({ subsets: ["latin"], weight: "400" });
const ooohBaby = Oooh_Baby({ subsets: ["latin"], weight: "400" });
const passionsConflict = Passions_Conflict({ subsets: ["latin"], weight: "400" });
const petemoss = Petemoss({ subsets: ["latin"], weight: "400" });
const puppiesPlay = Puppies_Play({ subsets: ["latin"], weight: "400" });
const qwitcherGrypen = Qwitcher_Grypen({ subsets: ["latin"], weight: ["400", "700"] });
const sassyFrass = Sassy_Frass({ subsets: ["latin"], weight: "400" });
const smooch = Smooch({ subsets: ["latin"], weight: "400" });
const squarePeg = Square_Peg({ subsets: ["latin"], weight: "400" });
const tapestry = Tapestry({ subsets: ["latin"], weight: "400" });
const theNautigal = The_Nautigal({ subsets: ["latin"], weight: ["400", "700"] });
const twinkleStar = Twinkle_Star({ subsets: ["latin"], weight: "400" });
const updock = Updock({ subsets: ["latin"], weight: "400" });
const vujahdayScript = Vujahday_Script({ subsets: ["latin"], weight: "400" });
const waterfall = Waterfall({ subsets: ["latin"], weight: "400" });
const comforter = Comforter({ subsets: ["latin"], weight: "400" });
const comforterBrush = Comforter_Brush({ subsets: ["latin"], weight: "400" });
const explora = Explora({ subsets: ["latin"], weight: "400" });
const festive = Festive({ subsets: ["latin"], weight: "400" });
const gwendolyn = Gwendolyn({ subsets: ["latin"], weight: ["400", "700"] });
const licorice = Licorice({ subsets: ["latin"], weight: "400" });
const mrsSheppards = Mrs_Sheppards({ subsets: ["latin"], weight: "400" });
const mySoul = My_Soul({ subsets: ["latin"], weight: "400" });
const praise = Praise({ subsets: ["latin"], weight: "400" });
const babylonica = Babylonica({ subsets: ["latin"], weight: "400" });
const beauRivage = Beau_Rivage({ subsets: ["latin"], weight: "400" });
const fuggles = Fuggles({ subsets: ["latin"], weight: "400" });
const charm = Charm({ subsets: ["latin"], weight: ["400", "700"] });
const charmonman = Charmonman({ subsets: ["latin"], weight: ["400", "700"] });
const mali = Mali({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const itim = Itim({ subsets: ["latin"], weight: "400" });
const sriracha = Sriracha({ subsets: ["latin"], weight: "400" });
const pattaya = Pattaya({ subsets: ["latin"], weight: "400" });
const sofia = Sofia({ subsets: ["latin"], weight: "400" });
const euphoriaScript = Euphoria_Script({ subsets: ["latin"], weight: "400" });
const clickerScript = Clicker_Script({ subsets: ["latin"], weight: "400" });
const engagement = Engagement({ subsets: ["latin"], weight: "400" });
const kristi = Kristi({ subsets: ["latin"], weight: "400" });
const laBelleAurore = La_Belle_Aurore({ subsets: ["latin"], weight: "400" });
const meddon = Meddon({ subsets: ["latin"], weight: "400" });
const overtheRainbow = Over_the_Rainbow({ subsets: ["latin"], weight: "400" });
const sueEllenFrancisco = Sue_Ellen_Francisco({ subsets: ["latin"], weight: "400" });
const zeyada = Zeyada({ subsets: ["latin"], weight: "400" });
const cedarvilleCursive = Cedarville_Cursive({ subsets: ["latin"], weight: "400" });
const dawningofaNewDay = Dawning_of_a_New_Day({ subsets: ["latin"], weight: "400" });
const giveYouGlory = Give_You_Glory({ subsets: ["latin"], weight: "400" });
const justMeAgainDownHere = Just_Me_Again_Down_Here({ subsets: ["latin"], weight: "400" });
const lovedbytheKing = Loved_by_the_King({ subsets: ["latin"], weight: "400" });
const waitingfortheSunrise = Waiting_for_the_Sunrise({ subsets: ["latin"], weight: "400" });
const calligraffitti = Calligraffitti({ subsets: ["latin"], weight: "400" });
const comingSoon = Coming_Soon({ subsets: ["latin"], weight: "400" });
const craftyGirls = Crafty_Girls({ subsets: ["latin"], weight: "400" });
const delius = Delius({ subsets: ["latin"], weight: "400" });
const deliusSwashCaps = Delius_Swash_Caps({ subsets: ["latin"], weight: "400" });
const gochiHand = Gochi_Hand({ subsets: ["latin"], weight: "400" });
const justAnotherHand = Just_Another_Hand({ subsets: ["latin"], weight: "400" });
const schoolbell = Schoolbell({ subsets: ["latin"], weight: "400" });
const shortStack = Short_Stack({ subsets: ["latin"], weight: "400" });
const sunshiney = Sunshiney({ subsets: ["latin"], weight: "400" });
const swankyandMooMoo = Swanky_and_Moo_Moo({ subsets: ["latin"], weight: "400" });
const walterTurncoat = Walter_Turncoat({ subsets: ["latin"], weight: "400" });
const annieUseYourTelescope = Annie_Use_Your_Telescope({ subsets: ["latin"], weight: "400" });
const chilanka = Chilanka({ subsets: ["latin"], weight: "400" });
const gaegu = Gaegu({ subsets: ["latin"], weight: ["400", "700"] });
const nanumPenScript = Nanum_Pen_Script({ subsets: ["latin"], weight: "400" });
const nanumBrushScript = Nanum_Brush_Script({ subsets: ["latin"], weight: "400" });
const hiMelody = Hi_Melody({ subsets: ["latin"], weight: "400" });
const dokdo = Dokdo({ subsets: ["latin"], weight: "400" });
const eastSeaDokdo = East_Sea_Dokdo({ subsets: ["latin"], weight: "400" });
const gamjaFlower = Gamja_Flower({ subsets: ["latin"], weight: "400" });
const poorStory = Poor_Story({ subsets: ["latin"], weight: "400" });
const yeonSung = Yeon_Sung({ subsets: ["latin"], weight: "400" });
const cuteFont = Cute_Font({ subsets: ["latin"], weight: "400" });
const doHyeon = Do_Hyeon({ subsets: ["latin"], weight: "400" });
const jua = Jua({ subsets: ["latin"], weight: "400" });
const kirangHaerang = Kirang_Haerang({ subsets: ["latin"], weight: "400" });
const blackHanSans = Black_Han_Sans({ subsets: ["latin"], weight: "400" });
const blackAndWhitePicture = Black_And_White_Picture({ subsets: ["latin"], weight: "400" });
const gugi = Gugi({ subsets: ["latin"], weight: "400" });
const hahmlet = Hahmlet({ subsets: ["latin"] });
const gowunDodum = Gowun_Dodum({ subsets: ["latin"], weight: "400" });
const gowunBatang = Gowun_Batang({ subsets: ["latin"], weight: ["400", "700"] });
const nanumGothic = Nanum_Gothic({ subsets: ["latin"], weight: ["400", "700", "800"] });
const nanumMyeongjo = Nanum_Myeongjo({ subsets: ["latin"], weight: ["400", "700", "800"] });
const notoSansKR = Noto_Sans_KR({ subsets: ["latin"] });
const rye = Rye({ subsets: ["latin"], weight: "400" });
const vastShadow = Vast_Shadow({ subsets: ["latin"], weight: "400" });
const chewy = Chewy({ subsets: ["latin"], weight: "400" });
const ranchers = Ranchers({ subsets: ["latin"], weight: "400" });
const londrinaSolid = Londrina_Solid({ subsets: ["latin"], weight: ["400", "900"] });
const londrinaShadow = Londrina_Shadow({ subsets: ["latin"], weight: "400" });
const londrinaOutline = Londrina_Outline({ subsets: ["latin"], weight: "400" });
const londrinaSketch = Londrina_Sketch({ subsets: ["latin"], weight: "400" });
const frederickatheGreat = Fredericka_the_Great({ subsets: ["latin"], weight: "400" });
const modak = Modak({ subsets: ["latin"], weight: "400" });
const kavoon = Kavoon({ subsets: ["latin"], weight: "400" });
const lemon = Lemon({ subsets: ["latin"], weight: "400" });
const cherryCreamSoda = Cherry_Cream_Soda({ subsets: ["latin"], weight: "400" });
const frijole = Frijole({ subsets: ["latin"], weight: "400" });
const knewave = Knewave({ subsets: ["latin"], weight: "400" });
const originalSurfer = Original_Surfer({ subsets: ["latin"], weight: "400" });
const sonsieOne = Sonsie_One({ subsets: ["latin"], weight: "400" });
const spicyRice = Spicy_Rice({ subsets: ["latin"], weight: "400" });
const ribeye = Ribeye({ subsets: ["latin"], weight: "400" });
const ribeyeMarrow = Ribeye_Marrow({ subsets: ["latin"], weight: "400" });
const sedgwickAve = Sedgwick_Ave({ subsets: ["latin"], weight: "400" });
const sedgwickAveDisplay = Sedgwick_Ave_Display({ subsets: ["latin"], weight: "400" });
const slackey = Slackey({ subsets: ["latin"], weight: "400" });
const tradeWinds = Trade_Winds({ subsets: ["latin"], weight: "400" });
const freckleFace = Freckle_Face({ subsets: ["latin"], weight: "400" });
const fontdinerSwanky = Fontdiner_Swanky({ subsets: ["latin"], weight: "400" });
const hennyPenny = Henny_Penny({ subsets: ["latin"], weight: "400" });
const nixieOne = Nixie_One({ subsets: ["latin"], weight: "400" });
const elsie = Elsie({ subsets: ["latin"], weight: ["400", "900"] });
const mysteryQuest = Mystery_Quest({ subsets: ["latin"], weight: "400" });
const protestRevolution = Protest_Revolution({ subsets: ["latin"], weight: "400" });
const protestGuerrilla = Protest_Guerrilla({ subsets: ["latin"], weight: "400" });
const alumniSans = Alumni_Sans({ subsets: ["latin"] });
const alumniSansCollegiateOne = Alumni_Sans_Collegiate_One({ subsets: ["latin"], weight: "400" });
const alumniSansInlineOne = Alumni_Sans_Inline_One({ subsets: ["latin"], weight: "400" });
const alumniSansPinstripe = Alumni_Sans_Pinstripe({ subsets: ["latin"], weight: "400" });
const graduate = Graduate({ subsets: ["latin"], weight: "400" });
const carterOne = Carter_One({ subsets: ["latin"], weight: "400" });
const coda = Coda({ subsets: ["latin"], weight: ["400", "800"] });
const coiny = Coiny({ subsets: ["latin"], weight: "400" });
const fascinate = Fascinate({ subsets: ["latin"], weight: "400" });
const fascinateInline = Fascinate_Inline({ subsets: ["latin"], weight: "400" });
const flavors = Flavors({ subsets: ["latin"], weight: "400" });
const galindo = Galindo({ subsets: ["latin"], weight: "400" });
const gorditas = Gorditas({ subsets: ["latin"], weight: ["400", "700"] });
const hanalei = Hanalei({ subsets: ["latin"], weight: "400" });
const hanaleiFill = Hanalei_Fill({ subsets: ["latin"], weight: "400" });
const jotiOne = Joti_One({ subsets: ["latin"], weight: "400" });
const kumarOne = Kumar_One({ subsets: ["latin"], weight: "400" });
const kumarOneOutline = Kumar_One_Outline({ subsets: ["latin"], weight: "400" });
const lakkiReddy = Lakki_Reddy({ subsets: ["latin"], weight: "400" });
const margarine = Margarine({ subsets: ["latin"], weight: "400" });
const metalMania = Metal_Mania({ subsets: ["latin"], weight: "400" });
const miltonian = Miltonian({ subsets: ["latin"], weight: "400" });
const miltonianTattoo = Miltonian_Tattoo({ subsets: ["latin"], weight: "400" });
const moul = Moul({ subsets: ["latin"], weight: "400" });
const mouseMemoirs = Mouse_Memoirs({ subsets: ["latin"], weight: "400" });
const newRocker = New_Rocker({ subsets: ["latin"], weight: "400" });
const nosifer = Nosifer({ subsets: ["latin"], weight: "400" });
const piedra = Piedra({ subsets: ["latin"], weight: "400" });
const pirataOne = Pirata_One({ subsets: ["latin"], weight: "400" });
const sancreek = Sancreek({ subsets: ["latin"], weight: "400" });
const sarina = Sarina({ subsets: ["latin"], weight: "400" });
const shojumaru = Shojumaru({ subsets: ["latin"], weight: "400" });
const smokum = Smokum({ subsets: ["latin"], weight: "400" });
const snowburstOne = Snowburst_One({ subsets: ["latin"], weight: "400" });
const stintUltraExpanded = Stint_Ultra_Expanded({ subsets: ["latin"], weight: "400" });
const stintUltraCondensed = Stint_Ultra_Condensed({ subsets: ["latin"], weight: "400" });
const supermercadoOne = Supermercado_One({ subsets: ["latin"], weight: "400" });
const trochut = Trochut({ subsets: ["latin"], weight: ["400", "700"] });
const unkempt = Unkempt({ subsets: ["latin"], weight: ["400", "700"] });
const wendyOne = Wendy_One({ subsets: ["latin"], weight: "400" });
const zillaSlabHighlight = Zilla_Slab_Highlight({ subsets: ["latin"], weight: ["400", "700"] });
const reggaeOne = Reggae_One({ subsets: ["latin"], weight: "400" });
const rocknRollOne = RocknRoll_One({ subsets: ["latin"], weight: "400" });
const rampartOne = Rampart_One({ subsets: ["latin"], weight: "400" });
const stick = Stick({ subsets: ["latin"], weight: "400" });
const trainOne = Train_One({ subsets: ["latin"], weight: "400" });
const yuseiMagic = Yusei_Magic({ subsets: ["latin"], weight: "400" });
const kaiseiOpti = Kaisei_Opti({ subsets: ["latin"], weight: ["400", "500", "700"] });
const kaiseiDecol = Kaisei_Decol({ subsets: ["latin"], weight: ["400", "500", "700"] });
const kaiseiHarunoUmi = Kaisei_HarunoUmi({ subsets: ["latin"], weight: ["400", "500", "700"] });
const kaiseiTokumin = Kaisei_Tokumin({ subsets: ["latin"], weight: ["400", "500", "700", "800"] });
const pottaOne = Potta_One({ subsets: ["latin"], weight: "400" });
const hachiMaruPop = Hachi_Maru_Pop({ subsets: ["latin"], weight: "400" });
const yomogi = Yomogi({ subsets: ["latin"], weight: "400" });
const zenAntique = Zen_Antique({ subsets: ["latin"], weight: "400" });
const zenKurenaido = Zen_Kurenaido({ subsets: ["latin"], weight: "400" });
const zenLoop = Zen_Loop({ subsets: ["latin"], weight: "400" });
const zenMaruGothic = Zen_Maru_Gothic({ subsets: ["latin"], weight: ["400", "500", "700", "900"] });
const zenOldMincho = Zen_Old_Mincho({ subsets: ["latin"], weight: ["400", "500", "600", "700", "900"] });
const kleeOne = Klee_One({ subsets: ["latin"], weight: ["400", "600"] });
const shipporiAntique = Shippori_Antique({ subsets: ["latin"], weight: "400" });
const shipporiAntiqueB1 = Shippori_Antique_B1({ subsets: ["latin"], weight: "400" });
const mochiyPopPOne = Mochiy_Pop_P_One({ subsets: ["latin"], weight: "400" });
const murecho = Murecho({ subsets: ["latin"] });
const mPLUS1 = M_PLUS_1({ subsets: ["latin"] });
const mPLUS2 = M_PLUS_2({ subsets: ["latin"] });
const mPLUS1Code = M_PLUS_1_Code({ subsets: ["latin"] });
const bIZUDPGothic = BIZ_UDPGothic({ subsets: ["latin"], weight: ["400", "700"] });
const bIZUDPMincho = BIZ_UDPMincho({ subsets: ["latin"], weight: ["400", "700"] });
const kosugi = Kosugi({ subsets: ["latin"], weight: "400" });
const kosugiMaru = Kosugi_Maru({ subsets: ["latin"], weight: "400" });
const sawarabiGothic = Sawarabi_Gothic({ subsets: ["latin"], weight: "400" });
const sawarabiMincho = Sawarabi_Mincho({ subsets: ["latin"], weight: "400" });
const hinaMincho = Hina_Mincho({ subsets: ["latin"], weight: "400" });
const yujiBoku = Yuji_Boku({ subsets: ["latin"], weight: "400" });
const yujiMai = Yuji_Mai({ subsets: ["latin"], weight: "400" });
const yujiSyuku = Yuji_Syuku({ subsets: ["latin"], weight: "400" });
const yujiHentaiganaAkari = Yuji_Hentaigana_Akari({ subsets: ["latin"], weight: "400" });
const yujiHentaiganaAkebono = Yuji_Hentaigana_Akebono({ subsets: ["latin"], weight: "400" });

const FONTS: { name: string; family: string | null; group: Group }[] = [
  { name: "Current (Orbitron)", family: null, group: "futuristic" },
  { name: "Current (Montserrat)", family: null, group: "common" },
  { name: "Inter", family: inter.style.fontFamily, group: "common" },
  { name: "Roboto", family: roboto.style.fontFamily, group: "common" },
  { name: "Open Sans", family: openSans.style.fontFamily, group: "common" },
  { name: "Lato", family: lato.style.fontFamily, group: "common" },
  { name: "Montserrat", family: montserrat.style.fontFamily, group: "common" },
  { name: "Poppins", family: poppins.style.fontFamily, group: "common" },
  { name: "Nunito", family: nunito.style.fontFamily, group: "common" },
  { name: "Nunito Sans", family: nunitoSans.style.fontFamily, group: "common" },
  { name: "Raleway", family: raleway.style.fontFamily, group: "common" },
  { name: "Work Sans", family: workSans.style.fontFamily, group: "common" },
  { name: "DM Sans", family: dMSans.style.fontFamily, group: "common" },
  { name: "Rubik", family: rubik.style.fontFamily, group: "common" },
  { name: "Karla", family: karla.style.fontFamily, group: "common" },
  { name: "Mulish", family: mulish.style.fontFamily, group: "common" },
  { name: "Cabin", family: cabin.style.fontFamily, group: "common" },
  { name: "Ubuntu", family: ubuntu.style.fontFamily, group: "common" },
  { name: "Source Sans 3", family: sourceSans3.style.fontFamily, group: "common" },
  { name: "Fira Sans", family: firaSans.style.fontFamily, group: "common" },
  { name: "PT Sans", family: pTSans.style.fontFamily, group: "common" },
  { name: "Noto Sans", family: notoSans.style.fontFamily, group: "common" },
  { name: "Public Sans", family: publicSans.style.fontFamily, group: "common" },
  { name: "IBM Plex Sans", family: iBMPlexSans.style.fontFamily, group: "common" },
  { name: "Figtree", family: figtree.style.fontFamily, group: "common" },
  { name: "Outfit", family: outfit.style.fontFamily, group: "common" },
  { name: "Sora", family: sora.style.fontFamily, group: "common" },
  { name: "Manrope", family: manrope.style.fontFamily, group: "common" },
  { name: "Plus Jakarta Sans", family: plusJakartaSans.style.fontFamily, group: "common" },
  { name: "Lexend", family: lexend.style.fontFamily, group: "common" },
  { name: "Urbanist", family: urbanist.style.fontFamily, group: "common" },
  { name: "Jost", family: jost.style.fontFamily, group: "common" },
  { name: "Josefin Sans", family: josefinSans.style.fontFamily, group: "common" },
  { name: "Archivo", family: archivo.style.fontFamily, group: "common" },
  { name: "Barlow", family: barlow.style.fontFamily, group: "common" },
  { name: "Hind", family: hind.style.fontFamily, group: "common" },
  { name: "Dosis", family: dosis.style.fontFamily, group: "common" },
  { name: "Signika", family: signika.style.fontFamily, group: "common" },
  { name: "Sen", family: sen.style.fontFamily, group: "common" },
  { name: "Quicksand", family: quicksand.style.fontFamily, group: "common" },
  { name: "Varela Round", family: varelaRound.style.fontFamily, group: "common" },
  { name: "Heebo", family: heebo.style.fontFamily, group: "common" },
  { name: "Assistant", family: assistant.style.fontFamily, group: "common" },
  { name: "Titillium Web", family: titilliumWeb.style.fontFamily, group: "common" },
  { name: "Exo 2", family: exo2.style.fontFamily, group: "common" },
  { name: "Kanit", family: kanit.style.fontFamily, group: "common" },
  { name: "Prompt", family: prompt.style.fontFamily, group: "common" },
  { name: "Red Hat Display", family: redHatDisplay.style.fontFamily, group: "common" },
  { name: "Red Hat Text", family: redHatText.style.fontFamily, group: "common" },
  { name: "Onest", family: onest.style.fontFamily, group: "common" },
  { name: "Instrument Sans", family: instrumentSans.style.fontFamily, group: "common" },
  { name: "Geist", family: geist.style.fontFamily, group: "common" },
  { name: "Syne", family: syne.style.fontFamily, group: "geometric" },
  { name: "Unbounded", family: unbounded.style.fontFamily, group: "geometric" },
  { name: "Bricolage Grotesque", family: bricolageGrotesque.style.fontFamily, group: "geometric" },
  { name: "Familjen Grotesk", family: familjenGrotesk.style.fontFamily, group: "geometric" },
  { name: "Gabarito", family: gabarito.style.fontFamily, group: "geometric" },
  { name: "Funnel Display", family: funnelDisplay.style.fontFamily, group: "geometric" },
  { name: "Host Grotesk", family: hostGrotesk.style.fontFamily, group: "geometric" },
  { name: "Schibsted Grotesk", family: schibstedGrotesk.style.fontFamily, group: "geometric" },
  { name: "Golos Text", family: golosText.style.fontFamily, group: "geometric" },
  { name: "Hanken Grotesk", family: hankenGrotesk.style.fontFamily, group: "geometric" },
  { name: "Albert Sans", family: albertSans.style.fontFamily, group: "geometric" },
  { name: "Epilogue", family: epilogue.style.fontFamily, group: "geometric" },
  { name: "Kumbh Sans", family: kumbhSans.style.fontFamily, group: "geometric" },
  { name: "Sofia Sans", family: sofiaSans.style.fontFamily, group: "geometric" },
  { name: "Wix Madefor Display", family: wixMadeforDisplay.style.fontFamily, group: "geometric" },
  { name: "Rethink Sans", family: rethinkSans.style.fontFamily, group: "geometric" },
  { name: "Afacad", family: afacad.style.fontFamily, group: "geometric" },
  { name: "Reddit Sans", family: redditSans.style.fontFamily, group: "geometric" },
  { name: "Parkinsans", family: parkinsans.style.fontFamily, group: "geometric" },
  { name: "Darker Grotesque", family: darkerGrotesque.style.fontFamily, group: "geometric" },
  { name: "Space Grotesk", family: spaceGrotesk.style.fontFamily, group: "geometric" },
  { name: "League Spartan", family: leagueSpartan.style.fontFamily, group: "geometric" },
  { name: "Questrial", family: questrial.style.fontFamily, group: "geometric" },
  { name: "Montserrat Alternates", family: montserratAlternates.style.fontFamily, group: "geometric" },
  { name: "Comfortaa", family: comfortaa.style.fontFamily, group: "geometric" },
  { name: "Fredoka", family: fredoka.style.fontFamily, group: "geometric" },
  { name: "Baloo 2", family: baloo2.style.fontFamily, group: "geometric" },
  { name: "Lexend Zetta", family: lexendZetta.style.fontFamily, group: "geometric" },
  { name: "Lexend Mega", family: lexendMega.style.fontFamily, group: "geometric" },
  { name: "Lexend Exa", family: lexendExa.style.fontFamily, group: "geometric" },
  { name: "Lexend Giga", family: lexendGiga.style.fontFamily, group: "geometric" },
  { name: "Tilt Warp", family: tiltWarp.style.fontFamily, group: "geometric" },
  { name: "Tilt Neon", family: tiltNeon.style.fontFamily, group: "geometric" },
  { name: "Anta", family: anta.style.fontFamily, group: "geometric" },
  { name: "Bruno Ace", family: brunoAce.style.fontFamily, group: "geometric" },
  { name: "Bruno Ace SC", family: brunoAceSC.style.fontFamily, group: "geometric" },
  { name: "Tomorrow", family: tomorrow.style.fontFamily, group: "geometric" },
  { name: "Tektur", family: tektur.style.fontFamily, group: "geometric" },
  { name: "Kdam Thmor Pro", family: kdamThmorPro.style.fontFamily, group: "geometric" },
  { name: "Genos", family: genos.style.fontFamily, group: "geometric" },
  { name: "Trispace", family: trispace.style.fontFamily, group: "geometric" },
  { name: "Smooch Sans", family: smoochSans.style.fontFamily, group: "geometric" },
  { name: "Mohave", family: mohave.style.fontFamily, group: "geometric" },
  { name: "Pathway Extreme", family: pathwayExtreme.style.fontFamily, group: "geometric" },
  { name: "Spinnaker", family: spinnaker.style.fontFamily, group: "geometric" },
  { name: "Telex", family: telex.style.fontFamily, group: "geometric" },
  { name: "Voltaire", family: voltaire.style.fontFamily, group: "geometric" },
  { name: "Yantramanav", family: yantramanav.style.fontFamily, group: "geometric" },
  { name: "M PLUS Rounded 1c", family: mPLUSRounded1c.style.fontFamily, group: "geometric" },
  { name: "Zen Kaku Gothic New", family: zenKakuGothicNew.style.fontFamily, group: "geometric" },
  { name: "Dela Gothic One", family: delaGothicOne.style.fontFamily, group: "geometric" },
  { name: "Righteous", family: righteous.style.fontFamily, group: "retro" },
  { name: "Audiowide", family: audiowide.style.fontFamily, group: "retro" },
  { name: "Days One", family: daysOne.style.fontFamily, group: "retro" },
  { name: "Monomaniac One", family: monomaniacOne.style.fontFamily, group: "retro" },
  { name: "Concert One", family: concertOne.style.fontFamily, group: "retro" },
  { name: "Lilita One", family: lilitaOne.style.fontFamily, group: "retro" },
  { name: "Paytone One", family: paytoneOne.style.fontFamily, group: "retro" },
  { name: "Bowlby One", family: bowlbyOne.style.fontFamily, group: "retro" },
  { name: "Bowlby One SC", family: bowlbyOneSC.style.fontFamily, group: "retro" },
  { name: "Racing Sans One", family: racingSansOne.style.fontFamily, group: "retro" },
  { name: "Krona One", family: kronaOne.style.fontFamily, group: "retro" },
  { name: "Goldman", family: goldman.style.fontFamily, group: "retro" },
  { name: "Iceberg", family: iceberg.style.fontFamily, group: "retro" },
  { name: "Turret Road", family: turretRoad.style.fontFamily, group: "retro" },
  { name: "Sarpanch", family: sarpanch.style.fontFamily, group: "retro" },
  { name: "Fugaz One", family: fugazOne.style.fontFamily, group: "retro" },
  { name: "Chango", family: chango.style.fontFamily, group: "retro" },
  { name: "Contrail One", family: contrailOne.style.fontFamily, group: "retro" },
  { name: "Boogaloo", family: boogaloo.style.fontFamily, group: "retro" },
  { name: "Sansita", family: sansita.style.fontFamily, group: "retro" },
  { name: "Sniglet", family: sniglet.style.fontFamily, group: "retro" },
  { name: "Shrikhand", family: shrikhand.style.fontFamily, group: "retro" },
  { name: "Titan One", family: titanOne.style.fontFamily, group: "retro" },
  { name: "Rowdies", family: rowdies.style.fontFamily, group: "retro" },
  { name: "Bagel Fat One", family: bagelFatOne.style.fontFamily, group: "retro" },
  { name: "Gasoek One", family: gasoekOne.style.fontFamily, group: "retro" },
  { name: "Bangers", family: bangers.style.fontFamily, group: "retro" },
  { name: "Luckiest Guy", family: luckiestGuy.style.fontFamily, group: "retro" },
  { name: "Alfa Slab One", family: alfaSlabOne.style.fontFamily, group: "retro" },
  { name: "Ultra", family: ultra.style.fontFamily, group: "retro" },
  { name: "Rammetto One", family: rammettoOne.style.fontFamily, group: "retro" },
  { name: "Rubik Mono One", family: rubikMonoOne.style.fontFamily, group: "retro" },
  { name: "Black Ops One", family: blackOpsOne.style.fontFamily, group: "retro" },
  { name: "Bungee", family: bungee.style.fontFamily, group: "retro" },
  { name: "Passion One", family: passionOne.style.fontFamily, group: "retro" },
  { name: "Squada One", family: squadaOne.style.fontFamily, group: "retro" },
  { name: "Russo One", family: russoOne.style.fontFamily, group: "retro" },
  { name: "Poller One", family: pollerOne.style.fontFamily, group: "retro" },
  { name: "Jockey One", family: jockeyOne.style.fontFamily, group: "retro" },
  { name: "Marvel", family: marvel.style.fontFamily, group: "retro" },
  { name: "Homenaje", family: homenaje.style.fontFamily, group: "retro" },
  { name: "Geo", family: geo.style.fontFamily, group: "retro" },
  { name: "Rationale", family: rationale.style.fontFamily, group: "retro" },
  { name: "Strait", family: strait.style.fontFamily, group: "retro" },
  { name: "Economica", family: economica.style.fontFamily, group: "retro" },
  { name: "Share", family: share.style.fontFamily, group: "retro" },
  { name: "Share Tech", family: shareTech.style.fontFamily, group: "retro" },
  { name: "Limelight", family: limelight.style.fontFamily, group: "retro" },
  { name: "Poiret One", family: poiretOne.style.fontFamily, group: "retro" },
  { name: "Abril Fatface", family: abrilFatface.style.fontFamily, group: "retro" },
  { name: "Yeseva One", family: yesevaOne.style.fontFamily, group: "retro" },
  { name: "Lobster", family: lobster.style.fontFamily, group: "retro" },
  { name: "Pacifico", family: pacifico.style.fontFamily, group: "retro" },
  { name: "Kaushan Script", family: kaushanScript.style.fontFamily, group: "retro" },
  { name: "Permanent Marker", family: permanentMarker.style.fontFamily, group: "retro" },
  { name: "Protest Strike", family: protestStrike.style.fontFamily, group: "retro" },
  { name: "Protest Riot", family: protestRiot.style.fontFamily, group: "retro" },
  { name: "Chonburi", family: chonburi.style.fontFamily, group: "retro" },
  { name: "Cherry Bomb One", family: cherryBombOne.style.fontFamily, group: "retro" },
  { name: "Mochiy Pop One", family: mochiyPopOne.style.fontFamily, group: "retro" },
  { name: "Jaro", family: jaro.style.fontFamily, group: "retro" },
  { name: "Climate Crisis", family: climateCrisis.style.fontFamily, group: "retro" },
  { name: "Foldit", family: foldit.style.fontFamily, group: "retro" },
  { name: "Faster One", family: fasterOne.style.fontFamily, group: "retro" },
  { name: "Wallpoet", family: wallpoet.style.fontFamily, group: "retro" },
  { name: "Syncopate", family: syncopate.style.fontFamily, group: "retro" },
  { name: "Major Mono Display", family: majorMonoDisplay.style.fontFamily, group: "retro" },
  { name: "Bungee Shade", family: bungeeShade.style.fontFamily, group: "retro" },
  { name: "Bungee Inline", family: bungeeInline.style.fontFamily, group: "retro" },
  { name: "Monoton", family: monoton.style.fontFamily, group: "retro" },
  { name: "Orbitron", family: orbitron.style.fontFamily, group: "space" },
  { name: "Michroma", family: michroma.style.fontFamily, group: "space" },
  { name: "Chakra Petch", family: chakraPetch.style.fontFamily, group: "space" },
  { name: "Oxanium", family: oxanium.style.fontFamily, group: "space" },
  { name: "Quantico", family: quantico.style.fontFamily, group: "space" },
  { name: "Aldrich", family: aldrich.style.fontFamily, group: "space" },
  { name: "Electrolize", family: electrolize.style.fontFamily, group: "space" },
  { name: "Jura", family: jura.style.fontFamily, group: "space" },
  { name: "Nova Square", family: novaSquare.style.fontFamily, group: "space" },
  { name: "Nova Flat", family: novaFlat.style.fontFamily, group: "space" },
  { name: "Nova Round", family: novaRound.style.fontFamily, group: "space" },
  { name: "Play", family: play.style.fontFamily, group: "space" },
  { name: "Saira", family: saira.style.fontFamily, group: "space" },
  { name: "Rajdhani", family: rajdhani.style.fontFamily, group: "space" },
  { name: "Bai Jamjuree", family: baiJamjuree.style.fontFamily, group: "space" },
  { name: "Advent Pro", family: adventPro.style.fontFamily, group: "space" },
  { name: "Gruppo", family: gruppo.style.fontFamily, group: "space" },
  { name: "Stick No Bills", family: stickNoBills.style.fontFamily, group: "space" },
  { name: "Sono", family: sono.style.fontFamily, group: "space" },
  { name: "Exo", family: exo.style.fontFamily, group: "space" },
  { name: "Zen Dots", family: zenDots.style.fontFamily, group: "space" },
  { name: "Tourney", family: tourney.style.fontFamily, group: "space" },
  { name: "Krub", family: krub.style.fontFamily, group: "space" },
  { name: "Mitr", family: mitr.style.fontFamily, group: "space" },
  { name: "Niramit", family: niramit.style.fontFamily, group: "space" },
  { name: "Grandstander", family: grandstander.style.fontFamily, group: "space" },
  { name: "Playfair Display", family: playfairDisplay.style.fontFamily, group: "serif" },
  { name: "Merriweather", family: merriweather.style.fontFamily, group: "serif" },
  { name: "Lora", family: lora.style.fontFamily, group: "serif" },
  { name: "Roboto Slab", family: robotoSlab.style.fontFamily, group: "serif" },
  { name: "Bitter", family: bitter.style.fontFamily, group: "serif" },
  { name: "Zilla Slab", family: zillaSlab.style.fontFamily, group: "serif" },
  { name: "Arvo", family: arvo.style.fontFamily, group: "serif" },
  { name: "Libre Baskerville", family: libreBaskerville.style.fontFamily, group: "serif" },
  { name: "DM Serif Display", family: dMSerifDisplay.style.fontFamily, group: "serif" },
  { name: "Fraunces", family: fraunces.style.fontFamily, group: "serif" },
  { name: "Instrument Serif", family: instrumentSerif.style.fontFamily, group: "serif" },
  { name: "Young Serif", family: youngSerif.style.fontFamily, group: "serif" },
  { name: "Newsreader", family: newsreader.style.fontFamily, group: "serif" },
  { name: "Spectral", family: spectral.style.fontFamily, group: "serif" },
  { name: "Crimson Pro", family: crimsonPro.style.fontFamily, group: "serif" },
  { name: "EB Garamond", family: eBGaramond.style.fontFamily, group: "serif" },
  { name: "Cardo", family: cardo.style.fontFamily, group: "serif" },
  { name: "Alegreya", family: alegreya.style.fontFamily, group: "serif" },
  { name: "Bodoni Moda", family: bodoniModa.style.fontFamily, group: "serif" },
  { name: "Italiana", family: italiana.style.fontFamily, group: "serif" },
  { name: "Marcellus", family: marcellus.style.fontFamily, group: "serif" },
  { name: "Forum", family: forum.style.fontFamily, group: "serif" },
  { name: "Julius Sans One", family: juliusSansOne.style.fontFamily, group: "serif" },
  { name: "Cinzel", family: cinzel.style.fontFamily, group: "serif" },
  { name: "Cinzel Decorative", family: cinzelDecorative.style.fontFamily, group: "serif" },
  { name: "Cormorant Garamond", family: cormorantGaramond.style.fontFamily, group: "serif" },
  { name: "Josefin Slab", family: josefinSlab.style.fontFamily, group: "serif" },
  { name: "Noto Serif", family: notoSerif.style.fontFamily, group: "serif" },
  { name: "Source Serif 4", family: sourceSerif4.style.fontFamily, group: "serif" },
  { name: "Domine", family: domine.style.fontFamily, group: "serif" },
  { name: "Vollkorn", family: vollkorn.style.fontFamily, group: "serif" },
  { name: "Prata", family: prata.style.fontFamily, group: "serif" },
  { name: "Gloock", family: gloock.style.fontFamily, group: "serif" },
  { name: "Bevan", family: bevan.style.fontFamily, group: "serif" },
  { name: "Oswald", family: oswald.style.fontFamily, group: "condensed" },
  { name: "Bebas Neue", family: bebasNeue.style.fontFamily, group: "condensed" },
  { name: "Anton", family: anton.style.fontFamily, group: "condensed" },
  { name: "Anton SC", family: antonSC.style.fontFamily, group: "condensed" },
  { name: "Antonio", family: antonio.style.fontFamily, group: "condensed" },
  { name: "Teko", family: teko.style.fontFamily, group: "condensed" },
  { name: "Archivo Black", family: archivoBlack.style.fontFamily, group: "condensed" },
  { name: "Archivo Narrow", family: archivoNarrow.style.fontFamily, group: "condensed" },
  { name: "Barlow Condensed", family: barlowCondensed.style.fontFamily, group: "condensed" },
  { name: "Barlow Semi Condensed", family: barlowSemiCondensed.style.fontFamily, group: "condensed" },
  { name: "Saira Condensed", family: sairaCondensed.style.fontFamily, group: "condensed" },
  { name: "Sofia Sans Condensed", family: sofiaSansCondensed.style.fontFamily, group: "condensed" },
  { name: "Fjalla One", family: fjallaOne.style.fontFamily, group: "condensed" },
  { name: "Pathway Gothic One", family: pathwayGothicOne.style.fontFamily, group: "condensed" },
  { name: "League Gothic", family: leagueGothic.style.fontFamily, group: "condensed" },
  { name: "Roboto Condensed", family: robotoCondensed.style.fontFamily, group: "condensed" },
  { name: "Fira Sans Condensed", family: firaSansCondensed.style.fontFamily, group: "condensed" },
  { name: "Ubuntu Condensed", family: ubuntuCondensed.style.fontFamily, group: "condensed" },
  { name: "Encode Sans Condensed", family: encodeSansCondensed.style.fontFamily, group: "condensed" },
  { name: "Yanone Kaffeesatz", family: yanoneKaffeesatz.style.fontFamily, group: "condensed" },
  { name: "Khand", family: khand.style.fontFamily, group: "condensed" },
  { name: "Pragati Narrow", family: pragatiNarrow.style.fontFamily, group: "condensed" },
  { name: "Six Caps", family: sixCaps.style.fontFamily, group: "condensed" },
  { name: "Staatliches", family: staatliches.style.fontFamily, group: "condensed" },
  { name: "Bungee Hairline", family: bungeeHairline.style.fontFamily, group: "condensed" },
  { name: "Space Mono", family: spaceMono.style.fontFamily, group: "mono" },
  { name: "JetBrains Mono", family: jetBrainsMono.style.fontFamily, group: "mono" },
  { name: "Geist Mono", family: geistMono.style.fontFamily, group: "mono" },
  { name: "Martian Mono", family: martianMono.style.fontFamily, group: "mono" },
  { name: "IBM Plex Mono", family: iBMPlexMono.style.fontFamily, group: "mono" },
  { name: "Roboto Mono", family: robotoMono.style.fontFamily, group: "mono" },
  { name: "Fira Code", family: firaCode.style.fontFamily, group: "mono" },
  { name: "Source Code Pro", family: sourceCodePro.style.fontFamily, group: "mono" },
  { name: "DM Mono", family: dMMono.style.fontFamily, group: "mono" },
  { name: "Azeret Mono", family: azeretMono.style.fontFamily, group: "mono" },
  { name: "Sometype Mono", family: sometypeMono.style.fontFamily, group: "mono" },
  { name: "Red Hat Mono", family: redHatMono.style.fontFamily, group: "mono" },
  { name: "Chivo Mono", family: chivoMono.style.fontFamily, group: "mono" },
  { name: "Spline Sans Mono", family: splineSansMono.style.fontFamily, group: "mono" },
  { name: "Nova Mono", family: novaMono.style.fontFamily, group: "mono" },
  { name: "Share Tech Mono", family: shareTechMono.style.fontFamily, group: "mono" },
  { name: "Xanh Mono", family: xanhMono.style.fontFamily, group: "mono" },
  { name: "Kode Mono", family: kodeMono.style.fontFamily, group: "mono" },
  { name: "Ubuntu Mono", family: ubuntuMono.style.fontFamily, group: "mono" },
  { name: "Courier Prime", family: courierPrime.style.fontFamily, group: "mono" },
  { name: "Inconsolata", family: inconsolata.style.fontFamily, group: "mono" },
  { name: "Overpass Mono", family: overpassMono.style.fontFamily, group: "mono" },
  { name: "Cutive Mono", family: cutiveMono.style.fontFamily, group: "mono" },
  { name: "Syne Mono", family: syneMono.style.fontFamily, group: "mono" },
  { name: "Fragment Mono", family: fragmentMono.style.fontFamily, group: "mono" },
  { name: "B612 Mono", family: b612Mono.style.fontFamily, group: "mono" },
  { name: "Unica One", family: unicaOne.style.fontFamily, group: "futuristic" },
  { name: "Federo", family: federo.style.fontFamily, group: "futuristic" },
  { name: "Megrim", family: megrim.style.fontFamily, group: "futuristic" },
  { name: "Kenia", family: kenia.style.fontFamily, group: "futuristic" },
  { name: "Revalia", family: revalia.style.fontFamily, group: "futuristic" },
  { name: "Stalinist One", family: stalinistOne.style.fontFamily, group: "futuristic" },
  { name: "Bungee Outline", family: bungeeOutline.style.fontFamily, group: "futuristic" },
  { name: "Rubik Iso", family: rubikIso.style.fontFamily, group: "futuristic" },
  { name: "Rubik 80s Fade", family: rubik80sFade.style.fontFamily, group: "futuristic" },
  { name: "Rubik Vinyl", family: rubikVinyl.style.fontFamily, group: "futuristic" },
  { name: "Rubik Moonrocks", family: rubikMoonrocks.style.fontFamily, group: "futuristic" },
  { name: "Rubik Lines", family: rubikLines.style.fontFamily, group: "futuristic" },
  { name: "Rubik Glitch", family: rubikGlitch.style.fontFamily, group: "futuristic" },
  { name: "Rubik Maze", family: rubikMaze.style.fontFamily, group: "futuristic" },
  { name: "Saira Stencil One", family: sairaStencilOne.style.fontFamily, group: "futuristic" },
  { name: "Allerta Stencil", family: allertaStencil.style.fontFamily, group: "futuristic" },
  { name: "Stardos Stencil", family: stardosStencil.style.fontFamily, group: "futuristic" },
  { name: "Sirin Stencil", family: sirinStencil.style.fontFamily, group: "futuristic" },
  { name: "Emblema One", family: emblemaOne.style.fontFamily, group: "futuristic" },
  { name: "Codystar", family: codystar.style.fontFamily, group: "futuristic" },
  { name: "Ropa Sans", family: ropaSans.style.fontFamily, group: "futuristic" },
  { name: "Prosto One", family: prostoOne.style.fontFamily, group: "futuristic" },
  { name: "Kelly Slab", family: kellySlab.style.fontFamily, group: "futuristic" },
  { name: "Sansation", family: sansation.style.fontFamily, group: "futuristic" },
  { name: "Iceland", family: iceland.style.fontFamily, group: "futuristic" },
  { name: "Nova Oval", family: novaOval.style.fontFamily, group: "futuristic" },
  { name: "Nova Cut", family: novaCut.style.fontFamily, group: "futuristic" },
  { name: "Nova Script", family: novaScript.style.fontFamily, group: "futuristic" },
  { name: "Nova Slim", family: novaSlim.style.fontFamily, group: "futuristic" },
  { name: "Lobster Two", family: lobsterTwo.style.fontFamily, group: "script" },
  { name: "Dancing Script", family: dancingScript.style.fontFamily, group: "script" },
  { name: "Great Vibes", family: greatVibes.style.fontFamily, group: "script" },
  { name: "Satisfy", family: satisfy.style.fontFamily, group: "script" },
  { name: "Cookie", family: cookie.style.fontFamily, group: "script" },
  { name: "Courgette", family: courgette.style.fontFamily, group: "script" },
  { name: "Sacramento", family: sacramento.style.fontFamily, group: "script" },
  { name: "Yellowtail", family: yellowtail.style.fontFamily, group: "script" },
  { name: "Allura", family: allura.style.fontFamily, group: "script" },
  { name: "Alex Brush", family: alexBrush.style.fontFamily, group: "script" },
  { name: "Parisienne", family: parisienne.style.fontFamily, group: "script" },
  { name: "Tangerine", family: tangerine.style.fontFamily, group: "script" },
  { name: "Pinyon Script", family: pinyonScript.style.fontFamily, group: "script" },
  { name: "Mr Dafoe", family: mrDafoe.style.fontFamily, group: "script" },
  { name: "Norican", family: norican.style.fontFamily, group: "script" },
  { name: "Oleo Script", family: oleoScript.style.fontFamily, group: "script" },
  { name: "Oleo Script Swash Caps", family: oleoScriptSwashCaps.style.fontFamily, group: "script" },
  { name: "Sansita Swashed", family: sansitaSwashed.style.fontFamily, group: "script" },
  { name: "Berkshire Swash", family: berkshireSwash.style.fontFamily, group: "script" },
  { name: "Playball", family: playball.style.fontFamily, group: "script" },
  { name: "Damion", family: damion.style.fontFamily, group: "script" },
  { name: "Marck Script", family: marckScript.style.fontFamily, group: "script" },
  { name: "Caveat", family: caveat.style.fontFamily, group: "script" },
  { name: "Shadows Into Light", family: shadowsIntoLight.style.fontFamily, group: "script" },
  { name: "Indie Flower", family: indieFlower.style.fontFamily, group: "script" },
  { name: "Amatic SC", family: amaticSC.style.fontFamily, group: "script" },
  { name: "Rock Salt", family: rockSalt.style.fontFamily, group: "script" },
  { name: "Homemade Apple", family: homemadeApple.style.fontFamily, group: "script" },
  { name: "Nothing You Could Do", family: nothingYouCouldDo.style.fontFamily, group: "script" },
  { name: "Reenie Beanie", family: reenieBeanie.style.fontFamily, group: "script" },
  { name: "Covered By Your Grace", family: coveredByYourGrace.style.fontFamily, group: "script" },
  { name: "Gloria Hallelujah", family: gloriaHallelujah.style.fontFamily, group: "script" },
  { name: "Architects Daughter", family: architectsDaughter.style.fontFamily, group: "script" },
  { name: "Patrick Hand", family: patrickHand.style.fontFamily, group: "script" },
  { name: "Kalam", family: kalam.style.fontFamily, group: "script" },
  { name: "Handlee", family: handlee.style.fontFamily, group: "script" },
  { name: "Neucha", family: neucha.style.fontFamily, group: "script" },
  { name: "Comic Neue", family: comicNeue.style.fontFamily, group: "script" },
  { name: "Bad Script", family: badScript.style.fontFamily, group: "script" },
  { name: "Merienda", family: merienda.style.fontFamily, group: "script" },
  { name: "Niconne", family: niconne.style.fontFamily, group: "script" },
  { name: "Rochester", family: rochester.style.fontFamily, group: "script" },
  { name: "Rouge Script", family: rougeScript.style.fontFamily, group: "script" },
  { name: "Herr Von Muellerhoff", family: herrVonMuellerhoff.style.fontFamily, group: "script" },
  { name: "Monsieur La Doulaise", family: monsieurLaDoulaise.style.fontFamily, group: "script" },
  { name: "Mrs Saint Delafield", family: mrsSaintDelafield.style.fontFamily, group: "script" },
  { name: "Italianno", family: italianno.style.fontFamily, group: "script" },
  { name: "Grand Hotel", family: grandHotel.style.fontFamily, group: "script" },
  { name: "Lily Script One", family: lilyScriptOne.style.fontFamily, group: "script" },
  { name: "Leckerli One", family: leckerliOne.style.fontFamily, group: "script" },
  { name: "Style Script", family: styleScript.style.fontFamily, group: "script" },
  { name: "Cherish", family: cherish.style.fontFamily, group: "script" },
  { name: "Carattere", family: carattere.style.fontFamily, group: "script" },
  { name: "Caramel", family: caramel.style.fontFamily, group: "script" },
  { name: "Ephesis", family: ephesis.style.fontFamily, group: "script" },
  { name: "Ms Madi", family: msMadi.style.fontFamily, group: "script" },
  { name: "Send Flowers", family: sendFlowers.style.fontFamily, group: "script" },
  { name: "Splash", family: splash.style.fontFamily, group: "script" },
  { name: "Water Brush", family: waterBrush.style.fontFamily, group: "script" },
  { name: "Whisper", family: whisper.style.fontFamily, group: "script" },
  { name: "Ballet", family: ballet.style.fontFamily, group: "script" },
  { name: "Birthstone", family: birthstone.style.fontFamily, group: "script" },
  { name: "Bonheur Royale", family: bonheurRoyale.style.fontFamily, group: "script" },
  { name: "Corinthia", family: corinthia.style.fontFamily, group: "script" },
  { name: "Estonia", family: estonia.style.fontFamily, group: "script" },
  { name: "Hurricane", family: hurricane.style.fontFamily, group: "script" },
  { name: "Imperial Script", family: imperialScript.style.fontFamily, group: "script" },
  { name: "Inspiration", family: inspiration.style.fontFamily, group: "script" },
  { name: "Island Moments", family: islandMoments.style.fontFamily, group: "script" },
  { name: "Kolker Brush", family: kolkerBrush.style.fontFamily, group: "script" },
  { name: "Lavishly Yours", family: lavishlyYours.style.fontFamily, group: "script" },
  { name: "Love Light", family: loveLight.style.fontFamily, group: "script" },
  { name: "Luxurious Script", family: luxuriousScript.style.fontFamily, group: "script" },
  { name: "Meow Script", family: meowScript.style.fontFamily, group: "script" },
  { name: "Moon Dance", family: moonDance.style.fontFamily, group: "script" },
  { name: "Mea Culpa", family: meaCulpa.style.fontFamily, group: "script" },
  { name: "Neonderthaw", family: neonderthaw.style.fontFamily, group: "script" },
  { name: "Oooh Baby", family: ooohBaby.style.fontFamily, group: "script" },
  { name: "Passions Conflict", family: passionsConflict.style.fontFamily, group: "script" },
  { name: "Petemoss", family: petemoss.style.fontFamily, group: "script" },
  { name: "Puppies Play", family: puppiesPlay.style.fontFamily, group: "script" },
  { name: "Qwitcher Grypen", family: qwitcherGrypen.style.fontFamily, group: "script" },
  { name: "Sassy Frass", family: sassyFrass.style.fontFamily, group: "script" },
  { name: "Smooch", family: smooch.style.fontFamily, group: "script" },
  { name: "Square Peg", family: squarePeg.style.fontFamily, group: "script" },
  { name: "Tapestry", family: tapestry.style.fontFamily, group: "script" },
  { name: "The Nautigal", family: theNautigal.style.fontFamily, group: "script" },
  { name: "Twinkle Star", family: twinkleStar.style.fontFamily, group: "script" },
  { name: "Updock", family: updock.style.fontFamily, group: "script" },
  { name: "Vujahday Script", family: vujahdayScript.style.fontFamily, group: "script" },
  { name: "Waterfall", family: waterfall.style.fontFamily, group: "script" },
  { name: "Comforter", family: comforter.style.fontFamily, group: "script" },
  { name: "Comforter Brush", family: comforterBrush.style.fontFamily, group: "script" },
  { name: "Explora", family: explora.style.fontFamily, group: "script" },
  { name: "Festive", family: festive.style.fontFamily, group: "script" },
  { name: "Gwendolyn", family: gwendolyn.style.fontFamily, group: "script" },
  { name: "Licorice", family: licorice.style.fontFamily, group: "script" },
  { name: "Mrs Sheppards", family: mrsSheppards.style.fontFamily, group: "script" },
  { name: "My Soul", family: mySoul.style.fontFamily, group: "script" },
  { name: "Praise", family: praise.style.fontFamily, group: "script" },
  { name: "Babylonica", family: babylonica.style.fontFamily, group: "script" },
  { name: "Beau Rivage", family: beauRivage.style.fontFamily, group: "script" },
  { name: "Fuggles", family: fuggles.style.fontFamily, group: "script" },
  { name: "Charm", family: charm.style.fontFamily, group: "script" },
  { name: "Charmonman", family: charmonman.style.fontFamily, group: "script" },
  { name: "Mali", family: mali.style.fontFamily, group: "script" },
  { name: "Itim", family: itim.style.fontFamily, group: "script" },
  { name: "Sriracha", family: sriracha.style.fontFamily, group: "script" },
  { name: "Pattaya", family: pattaya.style.fontFamily, group: "script" },
  { name: "Sofia", family: sofia.style.fontFamily, group: "script" },
  { name: "Euphoria Script", family: euphoriaScript.style.fontFamily, group: "script" },
  { name: "Clicker Script", family: clickerScript.style.fontFamily, group: "script" },
  { name: "Engagement", family: engagement.style.fontFamily, group: "script" },
  { name: "Kristi", family: kristi.style.fontFamily, group: "script" },
  { name: "La Belle Aurore", family: laBelleAurore.style.fontFamily, group: "script" },
  { name: "Meddon", family: meddon.style.fontFamily, group: "script" },
  { name: "Over the Rainbow", family: overtheRainbow.style.fontFamily, group: "script" },
  { name: "Sue Ellen Francisco", family: sueEllenFrancisco.style.fontFamily, group: "script" },
  { name: "Zeyada", family: zeyada.style.fontFamily, group: "script" },
  { name: "Cedarville Cursive", family: cedarvilleCursive.style.fontFamily, group: "script" },
  { name: "Dawning of a New Day", family: dawningofaNewDay.style.fontFamily, group: "script" },
  { name: "Give You Glory", family: giveYouGlory.style.fontFamily, group: "script" },
  { name: "Just Me Again Down Here", family: justMeAgainDownHere.style.fontFamily, group: "script" },
  { name: "Loved by the King", family: lovedbytheKing.style.fontFamily, group: "script" },
  { name: "Waiting for the Sunrise", family: waitingfortheSunrise.style.fontFamily, group: "script" },
  { name: "Calligraffitti", family: calligraffitti.style.fontFamily, group: "script" },
  { name: "Coming Soon", family: comingSoon.style.fontFamily, group: "script" },
  { name: "Crafty Girls", family: craftyGirls.style.fontFamily, group: "script" },
  { name: "Delius", family: delius.style.fontFamily, group: "script" },
  { name: "Delius Swash Caps", family: deliusSwashCaps.style.fontFamily, group: "script" },
  { name: "Gochi Hand", family: gochiHand.style.fontFamily, group: "script" },
  { name: "Just Another Hand", family: justAnotherHand.style.fontFamily, group: "script" },
  { name: "Schoolbell", family: schoolbell.style.fontFamily, group: "script" },
  { name: "Short Stack", family: shortStack.style.fontFamily, group: "script" },
  { name: "Sunshiney", family: sunshiney.style.fontFamily, group: "script" },
  { name: "Swanky and Moo Moo", family: swankyandMooMoo.style.fontFamily, group: "script" },
  { name: "Walter Turncoat", family: walterTurncoat.style.fontFamily, group: "script" },
  { name: "Annie Use Your Telescope", family: annieUseYourTelescope.style.fontFamily, group: "script" },
  { name: "Chilanka", family: chilanka.style.fontFamily, group: "script" },
  { name: "Gaegu", family: gaegu.style.fontFamily, group: "script" },
  { name: "Nanum Pen Script", family: nanumPenScript.style.fontFamily, group: "script" },
  { name: "Nanum Brush Script", family: nanumBrushScript.style.fontFamily, group: "script" },
  { name: "Hi Melody", family: hiMelody.style.fontFamily, group: "script" },
  { name: "Dokdo", family: dokdo.style.fontFamily, group: "script" },
  { name: "East Sea Dokdo", family: eastSeaDokdo.style.fontFamily, group: "script" },
  { name: "Gamja Flower", family: gamjaFlower.style.fontFamily, group: "script" },
  { name: "Poor Story", family: poorStory.style.fontFamily, group: "script" },
  { name: "Yeon Sung", family: yeonSung.style.fontFamily, group: "script" },
  { name: "Cute Font", family: cuteFont.style.fontFamily, group: "script" },
  { name: "Do Hyeon", family: doHyeon.style.fontFamily, group: "script" },
  { name: "Jua", family: jua.style.fontFamily, group: "script" },
  { name: "Kirang Haerang", family: kirangHaerang.style.fontFamily, group: "script" },
  { name: "Black Han Sans", family: blackHanSans.style.fontFamily, group: "script" },
  { name: "Black And White Picture", family: blackAndWhitePicture.style.fontFamily, group: "script" },
  { name: "Gugi", family: gugi.style.fontFamily, group: "script" },
  { name: "Hahmlet", family: hahmlet.style.fontFamily, group: "script" },
  { name: "Gowun Dodum", family: gowunDodum.style.fontFamily, group: "script" },
  { name: "Gowun Batang", family: gowunBatang.style.fontFamily, group: "script" },
  { name: "Nanum Gothic", family: nanumGothic.style.fontFamily, group: "script" },
  { name: "Nanum Myeongjo", family: nanumMyeongjo.style.fontFamily, group: "script" },
  { name: "Noto Sans KR", family: notoSansKR.style.fontFamily, group: "script" },
  { name: "Rye", family: rye.style.fontFamily, group: "display" },
  { name: "Vast Shadow", family: vastShadow.style.fontFamily, group: "display" },
  { name: "Chewy", family: chewy.style.fontFamily, group: "display" },
  { name: "Ranchers", family: ranchers.style.fontFamily, group: "display" },
  { name: "Londrina Solid", family: londrinaSolid.style.fontFamily, group: "display" },
  { name: "Londrina Shadow", family: londrinaShadow.style.fontFamily, group: "display" },
  { name: "Londrina Outline", family: londrinaOutline.style.fontFamily, group: "display" },
  { name: "Londrina Sketch", family: londrinaSketch.style.fontFamily, group: "display" },
  { name: "Fredericka the Great", family: frederickatheGreat.style.fontFamily, group: "display" },
  { name: "Modak", family: modak.style.fontFamily, group: "display" },
  { name: "Kavoon", family: kavoon.style.fontFamily, group: "display" },
  { name: "Lemon", family: lemon.style.fontFamily, group: "display" },
  { name: "Cherry Cream Soda", family: cherryCreamSoda.style.fontFamily, group: "display" },
  { name: "Frijole", family: frijole.style.fontFamily, group: "display" },
  { name: "Knewave", family: knewave.style.fontFamily, group: "display" },
  { name: "Original Surfer", family: originalSurfer.style.fontFamily, group: "display" },
  { name: "Sonsie One", family: sonsieOne.style.fontFamily, group: "display" },
  { name: "Spicy Rice", family: spicyRice.style.fontFamily, group: "display" },
  { name: "Ribeye", family: ribeye.style.fontFamily, group: "display" },
  { name: "Ribeye Marrow", family: ribeyeMarrow.style.fontFamily, group: "display" },
  { name: "Sedgwick Ave", family: sedgwickAve.style.fontFamily, group: "display" },
  { name: "Sedgwick Ave Display", family: sedgwickAveDisplay.style.fontFamily, group: "display" },
  { name: "Slackey", family: slackey.style.fontFamily, group: "display" },
  { name: "Trade Winds", family: tradeWinds.style.fontFamily, group: "display" },
  { name: "Freckle Face", family: freckleFace.style.fontFamily, group: "display" },
  { name: "Fontdiner Swanky", family: fontdinerSwanky.style.fontFamily, group: "display" },
  { name: "Henny Penny", family: hennyPenny.style.fontFamily, group: "display" },
  { name: "Nixie One", family: nixieOne.style.fontFamily, group: "display" },
  { name: "Elsie", family: elsie.style.fontFamily, group: "display" },
  { name: "Mystery Quest", family: mysteryQuest.style.fontFamily, group: "display" },
  { name: "Protest Revolution", family: protestRevolution.style.fontFamily, group: "display" },
  { name: "Protest Guerrilla", family: protestGuerrilla.style.fontFamily, group: "display" },
  { name: "Alumni Sans", family: alumniSans.style.fontFamily, group: "display" },
  { name: "Alumni Sans Collegiate One", family: alumniSansCollegiateOne.style.fontFamily, group: "display" },
  { name: "Alumni Sans Inline One", family: alumniSansInlineOne.style.fontFamily, group: "display" },
  { name: "Alumni Sans Pinstripe", family: alumniSansPinstripe.style.fontFamily, group: "display" },
  { name: "Graduate", family: graduate.style.fontFamily, group: "display" },
  { name: "Carter One", family: carterOne.style.fontFamily, group: "display" },
  { name: "Coda", family: coda.style.fontFamily, group: "display" },
  { name: "Coiny", family: coiny.style.fontFamily, group: "display" },
  { name: "Fascinate", family: fascinate.style.fontFamily, group: "display" },
  { name: "Fascinate Inline", family: fascinateInline.style.fontFamily, group: "display" },
  { name: "Flavors", family: flavors.style.fontFamily, group: "display" },
  { name: "Galindo", family: galindo.style.fontFamily, group: "display" },
  { name: "Gorditas", family: gorditas.style.fontFamily, group: "display" },
  { name: "Hanalei", family: hanalei.style.fontFamily, group: "display" },
  { name: "Hanalei Fill", family: hanaleiFill.style.fontFamily, group: "display" },
  { name: "Joti One", family: jotiOne.style.fontFamily, group: "display" },
  { name: "Kumar One", family: kumarOne.style.fontFamily, group: "display" },
  { name: "Kumar One Outline", family: kumarOneOutline.style.fontFamily, group: "display" },
  { name: "Lakki Reddy", family: lakkiReddy.style.fontFamily, group: "display" },
  { name: "Margarine", family: margarine.style.fontFamily, group: "display" },
  { name: "Metal Mania", family: metalMania.style.fontFamily, group: "display" },
  { name: "Miltonian", family: miltonian.style.fontFamily, group: "display" },
  { name: "Miltonian Tattoo", family: miltonianTattoo.style.fontFamily, group: "display" },
  { name: "Moul", family: moul.style.fontFamily, group: "display" },
  { name: "Mouse Memoirs", family: mouseMemoirs.style.fontFamily, group: "display" },
  { name: "New Rocker", family: newRocker.style.fontFamily, group: "display" },
  { name: "Nosifer", family: nosifer.style.fontFamily, group: "display" },
  { name: "Piedra", family: piedra.style.fontFamily, group: "display" },
  { name: "Pirata One", family: pirataOne.style.fontFamily, group: "display" },
  { name: "Sancreek", family: sancreek.style.fontFamily, group: "display" },
  { name: "Sarina", family: sarina.style.fontFamily, group: "display" },
  { name: "Shojumaru", family: shojumaru.style.fontFamily, group: "display" },
  { name: "Smokum", family: smokum.style.fontFamily, group: "display" },
  { name: "Snowburst One", family: snowburstOne.style.fontFamily, group: "display" },
  { name: "Stint Ultra Expanded", family: stintUltraExpanded.style.fontFamily, group: "display" },
  { name: "Stint Ultra Condensed", family: stintUltraCondensed.style.fontFamily, group: "display" },
  { name: "Supermercado One", family: supermercadoOne.style.fontFamily, group: "display" },
  { name: "Trochut", family: trochut.style.fontFamily, group: "display" },
  { name: "Unkempt", family: unkempt.style.fontFamily, group: "display" },
  { name: "Wendy One", family: wendyOne.style.fontFamily, group: "display" },
  { name: "Zilla Slab Highlight", family: zillaSlabHighlight.style.fontFamily, group: "display" },
  { name: "Reggae One", family: reggaeOne.style.fontFamily, group: "display" },
  { name: "RocknRoll One", family: rocknRollOne.style.fontFamily, group: "display" },
  { name: "Rampart One", family: rampartOne.style.fontFamily, group: "display" },
  { name: "Stick", family: stick.style.fontFamily, group: "display" },
  { name: "Train One", family: trainOne.style.fontFamily, group: "display" },
  { name: "Yusei Magic", family: yuseiMagic.style.fontFamily, group: "display" },
  { name: "Kaisei Opti", family: kaiseiOpti.style.fontFamily, group: "display" },
  { name: "Kaisei Decol", family: kaiseiDecol.style.fontFamily, group: "display" },
  { name: "Kaisei HarunoUmi", family: kaiseiHarunoUmi.style.fontFamily, group: "display" },
  { name: "Kaisei Tokumin", family: kaiseiTokumin.style.fontFamily, group: "display" },
  { name: "Potta One", family: pottaOne.style.fontFamily, group: "display" },
  { name: "Hachi Maru Pop", family: hachiMaruPop.style.fontFamily, group: "display" },
  { name: "Yomogi", family: yomogi.style.fontFamily, group: "display" },
  { name: "Zen Antique", family: zenAntique.style.fontFamily, group: "display" },
  { name: "Zen Kurenaido", family: zenKurenaido.style.fontFamily, group: "display" },
  { name: "Zen Loop", family: zenLoop.style.fontFamily, group: "display" },
  { name: "Zen Maru Gothic", family: zenMaruGothic.style.fontFamily, group: "display" },
  { name: "Zen Old Mincho", family: zenOldMincho.style.fontFamily, group: "display" },
  { name: "Klee One", family: kleeOne.style.fontFamily, group: "display" },
  { name: "Shippori Antique", family: shipporiAntique.style.fontFamily, group: "display" },
  { name: "Shippori Antique B1", family: shipporiAntiqueB1.style.fontFamily, group: "display" },
  { name: "Mochiy Pop P One", family: mochiyPopPOne.style.fontFamily, group: "display" },
  { name: "Murecho", family: murecho.style.fontFamily, group: "display" },
  { name: "M PLUS 1", family: mPLUS1.style.fontFamily, group: "display" },
  { name: "M PLUS 2", family: mPLUS2.style.fontFamily, group: "display" },
  { name: "M PLUS 1 Code", family: mPLUS1Code.style.fontFamily, group: "display" },
  { name: "BIZ UDPGothic", family: bIZUDPGothic.style.fontFamily, group: "display" },
  { name: "BIZ UDPMincho", family: bIZUDPMincho.style.fontFamily, group: "display" },
  { name: "Kosugi", family: kosugi.style.fontFamily, group: "display" },
  { name: "Kosugi Maru", family: kosugiMaru.style.fontFamily, group: "display" },
  { name: "Sawarabi Gothic", family: sawarabiGothic.style.fontFamily, group: "display" },
  { name: "Sawarabi Mincho", family: sawarabiMincho.style.fontFamily, group: "display" },
  { name: "Hina Mincho", family: hinaMincho.style.fontFamily, group: "display" },
  { name: "Yuji Boku", family: yujiBoku.style.fontFamily, group: "display" },
  { name: "Yuji Mai", family: yujiMai.style.fontFamily, group: "display" },
  { name: "Yuji Syuku", family: yujiSyuku.style.fontFamily, group: "display" },
  { name: "Yuji Hentaigana Akari", family: yujiHentaiganaAkari.style.fontFamily, group: "display" },
  { name: "Yuji Hentaigana Akebono", family: yujiHentaiganaAkebono.style.fontFamily, group: "display" },
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
const PRESET_NAMES: Record<string, string> = { "#FF4500": "Ghostplug", "#0095FF": "Brandflare", "#22C55E": "StonedGPT", "#3B82F6": "Recruiterbase", "#34D399": "Hypertheory", "#E63B12": "Vermilion", "#F04E23": "Chili", "#FF3D00": "Ember", "#FF5A1F": "Blaze", "#FF6A00": "Tangerine", "#FF7A00": "Flare", "#FF8A00": "Marigold", "#FF9500": "Apricot", "#FFA000": "Amber", "#FFB000": "Saffron", "#FFC107": "Gold", "#FFD000": "Sunflower", "#E85D04": "Burnt orange", "#ED7014": "Carrot", "#F5A623": "Honey", "#FF6F3C": "Persimmon", "#FF4E50": "Coral heat", "#FFB347": "Peach", "#FFCC33": "Yellow gold", "#FDBA12": "Mustard", "#FF8C42": "Cantaloupe", "#FF9F1C": "Orange peel", "#F77F00": "Pumpkin", "#FCBF49": "Maize" };

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

const family = (name: string) => FONTS.find((f) => f.name === name)?.family ?? undefined;

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
  const [hidden, setHidden] = useState(false);

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
