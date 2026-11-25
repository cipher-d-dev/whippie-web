/** Emoji for the picker, by category. Shown with the phone's own emoji font. */
const split = (s: string) => [...new Intl.Segmenter("en", { granularity: "grapheme" }).segment(s.replace(/\s+/g, ""))].map((x) => x.segment);

export const EMOJI_CATEGORIES: { id: string; label: string; icon: string; emoji: string[] }[] = [
  {
    id: "smileys", label: "Smileys", icon: "😀",
    emoji: split(`😀😃😄😁😆😅😂🤣🥲☺️😊😇🙂🙃😉😌😍🥰😘😗😙😚😋😛😝😜🤪🤨🧐🤓😎🥸🤩🥳😏😒😞😔😟😕🙁☹️😣😖😫😩🥺😢😭😤😠😡🤬🤯😳🥵🥶😱😨😰😥😓🫣🤗🫡🤔🫢🤭🤫🤥😶😐😑😬🫠🙄😯😦😧😮😲🥱😴🤤😪😵🤐🥴🤢🤮🤧😷🤒🤕🤑🤠😈👿👻💀👽🤖💩😺😸😹😻😼😽🙀😿😾`),
  },
  {
    id: "gestures", label: "Gestures", icon: "👍",
    emoji: split(`👍👎👊✊🤛🤜👏🙌🫶👐🤲🤝🙏✌️🤞🫰🤟🤘👌🤌🤏👈👉👆👇☝️✋🤚🖐️🖖👋🤙💪🦾✍️💅🤳👀👁️👂👃🧠🫀🫁🦷👅👄💋`),
  },
  {
    id: "people", label: "People", icon: "🧑🏾",
    emoji: split(`👶🧒👦👧🧑👨👩🧓👴👵🧑🏾👨🏾👩🏾🧑🏿👨🏿👩🏿🧑🏽‍💻👨🏾‍💼👩🏾‍💼🧑🏾‍🎓👩🏾‍🎓👨🏾‍🎓🧑🏾‍🏫🧑🏾‍🔧🧑🏾‍🎨🧑🏾‍🍳🧑🏾‍⚕️👮🏾💂🏾🕵🏾👷🏾🤵🏾👰🏾🤰🏾🙋🏾🙋🏾‍♂️🙆🏾🙅🏾🤷🏾🤷🏾‍♂️🤦🏾🤦🏾‍♂️💁🏾🙇🏾🧏🏾🚶🏾🏃🏾💃🏾🕺🏾👯🧘🏾🛀🏾🛌🏾👭👫👬💑👪`),
  },
  {
    id: "hearts", label: "Hearts & symbols", icon: "❤️",
    emoji: split(`❤️🧡💛💚💙💜🖤🤍🤎💔❤️‍🔥❣️💕💞💓💗💖💘💝💟☮️✝️☪️🕉️☯️🔯🛐✅☑️✔️❌❎➕➖➗✖️💯💢💥💫💦💨🕳️💬🗨️💭💤🔥⭐🌟✨⚡☀️🌈❄️☔🎵🎶🔔🔕📣📢⚠️🚫⛔🆗🆕🆒🆓🔝🔜‼️⁉️❓❔❗❕〽️🔴🟠🟡🟢🔵🟣⚫⚪🟥🟧🟨🟩🟦🟪`),
  },
  {
    id: "work", label: "Work & study", icon: "💼",
    emoji: split(`💼📁📂🗂️📅📆🗓️📇📈📉📊📋📌📍📎🖇️📏📐✂️🗃️🗄️🗑️🔒🔓🔏🔐🔑🗝️🔨🛠️⚙️🧰💡🔦🕯️📚📖📕📗📘📙📓📔📒📃📜📄📰🗞️📑🔖🏷️✏️✒️🖋️🖊️🖌️🖍️📝💻🖥️🖨️⌨️🖱️💾💿📀📱📲☎️📞📟📠📺📻🎙️🎚️🎛️🎧🎤📷📸📹🎥📽️🎞️🔍🔎🧾💳💰💵💸🏦🏢🏛️⏰⏱️⌛⏳🎓🏆🥇🥈🥉🎯🎉🎊🎁🎈`),
  },
  {
    id: "food", label: "Food & drink", icon: "🍲",
    emoji: split(`🍎🍊🍋🍌🍉🍇🍓🫐🍈🍒🍑🥭🍍🥥🥝🍅🥑🍆🥔🥕🌽🌶️🫑🥒🥬🥦🧄🧅🍄🥜🫘🌰🍞🥐🥖🫓🥨🥯🥞🧇🧀🍗🍖🥩🍔🍟🍕🌭🥪🌮🌯🥙🧆🥚🍳🥘🍲🫕🥣🥗🍿🧈🧂🥫🍱🍘🍙🍚🍛🍜🍝🍠🍢🍣🍤🍥🥮🍡🥟🥠🥡🍦🍧🍨🍩🍪🎂🍰🧁🥧🍫🍬🍭🍮🍯🍼🥛☕🫖🍵🧃🥤🧋🍶🍺🍻🥂🍷🥃🍸🍹🧉🍾🧊`),
  },
  {
    id: "nature", label: "Animals & nature", icon: "🌿",
    emoji: split(`🐶🐱🐭🐹🐰🦊🐻🐼🐨🐯🦁🐮🐷🐸🐵🙈🙉🙊🐔🐧🐦🐤🦆🦅🦉🦇🐺🐗🐴🦄🐝🐛🦋🐌🐞🐜🪲🦗🕷️🦂🐢🐍🦎🐙🦑🦀🐡🐠🐟🐬🐳🐋🦈🐊🐅🐆🦓🦍🐘🦛🦏🐪🐫🦒🦘🐃🐂🐄🐎🐖🐏🐑🐐🦌🐕🐈🐓🦃🦚🦜🌵🎄🌲🌳🌴🌱🌿☘️🍀🎍🎋🍃🍂🍁🌾💐🌷🌹🥀🌺🌸🌼🌻🌞🌝🌛🌜🌚🌕🌙🌎🌍🌏🪐💫⭐🌤️⛅🌥️☁️🌦️🌧️⛈️🌩️🌨️☃️⛄🌬️🌊💧`),
  },
  {
    id: "travel", label: "Travel & places", icon: "🚗",
    emoji: split(`🚗🚕🚙🚌🚎🏎️🚓🚑🚒🚐🛻🚚🚛🚜🏍️🛵🚲🛴🚨🚔🚍🚘🚖✈️🛫🛬🚁🚀🛸🚢⛴️🛥️⚓⛽🚧🚦🚥🗺️🗿🗽🗼🏰🏯🏟️🎡🎢🎠⛲⛱️🏖️🏝️🏜️🌋⛰️🏔️🗻🏕️⛺🏠🏡🏘️🏚️🏗️🏭🏬🏣🏤🏥🏪🏫🏩💒⛪🕌🕍🛕🕋⛩️🌁🌃🏙️🌄🌅🌆🌇🌉🎆🎇🇳🇬`),
  },
  {
    id: "activities", label: "Activities", icon: "⚽",
    emoji: split(`⚽🏀🏈⚾🥎🎾🏐🏉🥏🎱🪀🏓🏸🏒🏑🥍🏏🪃🥅⛳🪁🏹🎣🤿🥊🥋🎽🛹🛼🛷⛸️🥌🎿⛷️🏂🪂🏋🏾🤸🏾⛹🏾🤺🤾🏾🏌🏾🏇🏾🧗🏾🏄🏾🏊🏾🤽🏾🚣🏾🚴🏾🎖️🏅🎗️🎫🎟️🎪🤹🏾🎭🎨🎬🎤🎧🎼🎹🥁🪘🎷🎺🪗🎸🪕🎻🎲♟️🎯🎳🎮🎰🧩`),
  },
];

/** Quick reactions, like WhatsApp. */
export const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

const RECENT_KEY = "whippie-recent-emoji";
export function recentEmoji(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]").slice(0, 24);
  } catch {
    return [];
  }
}
export function rememberEmoji(e: string) {
  try {
    const next = [e, ...recentEmoji().filter((x) => x !== e)].slice(0, 24);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch { /* storage blocked: fine */ }
}

/** True for a message that is only 1–3 emoji (shown large, like WhatsApp). */
export function isEmojiOnly(text: string): boolean {
  const t = text.replace(/\s+/g, "");
  if (!t || t.length > 40) return false;
  if (!/^(?:\p{Extended_Pictographic}|\p{Emoji_Component}|‍|️|⃣)+$/u.test(t)) return false;
  if (/^[\d#*]+$/.test(t)) return false;
  const n = [...new Intl.Segmenter("en", { granularity: "grapheme" }).segment(t)].length;
  return n >= 1 && n <= 3;
}

export const STICKERS = [
  { id: "thank-you", label: "Thank you" }, { id: "well-done", label: "Well done" }, { id: "good-morning", label: "Good morning" },
  { id: "on-my-way", label: "On my way" }, { id: "noted", label: "Noted" }, { id: "congrats", label: "Congrats" },
  { id: "lol", label: "LOL" }, { id: "sorry", label: "Sorry" }, { id: "welcome", label: "Welcome" },
  { id: "see-you", label: "See you tomorrow" }, { id: "yes", label: "Yes" }, { id: "coffee", label: "Break time" },
] as const;
export type StickerId = (typeof STICKERS)[number]["id"];
export const stickerLabel = (id: string) => STICKERS.find((s) => s.id === id)?.label ?? "Sticker";
