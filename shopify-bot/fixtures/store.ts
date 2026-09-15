/**
 * A fake Pakistani Shopify store, used to develop and evaluate the agent with
 * no Shopify account and no database.
 *
 * Deliberately realistic, including the annoying parts: a few products have
 * thin or useless descriptions, some variants are out of stock, one product is
 * sold out entirely, and the sizing is inconsistent between products. Real
 * merchant catalogs look like this, and the bot has to cope.
 */

import type { Product, StoreDoc, StoreSnapshot, Variant } from "../src/types.js";

let variantCounter = 40000000000;

function v(
  options: Record<string, string>,
  price: number,
  qty: number,
  extra: { compareAtPrice?: number; sku?: string } = {},
): Variant {
  const id = String(++variantCounter);
  return {
    id,
    gid: `gid://shopify/ProductVariant/${id}`,
    title: Object.values(options).join(" / ") || "Default Title",
    options,
    price,
    inventoryQuantity: qty,
    available: qty > 0,
    ...extra,
  };
}

let productCounter = 8000000000;

function p(
  handle: string,
  title: string,
  description: string,
  productType: string,
  tags: string[],
  collections: string[],
  variants: Variant[],
): Product {
  const id = String(++productCounter);
  return {
    id,
    handle,
    title,
    description,
    productType,
    vendor: "Sana Threads",
    tags,
    status: "ACTIVE",
    collections,
    variants,
    imageUrl: `https://cdn.example.com/${handle}.jpg`,
  };
}

const SIZES = ["S", "M", "L", "XL"];

function sized(price: number, stock: number[], color = "Default"): Variant[] {
  return SIZES.map((size, i) =>
    v({ Size: size, Color: color }, price, stock[i] ?? 0),
  );
}

export const products: Product[] = [
  p(
    "embroidered-lawn-3pc-azure",
    "Embroidered Lawn 3-Piece - Azure",
    "Unstitched three piece lawn suit. Embroidered front, printed back and sleeves, cotton trouser and a chiffon dupatta. Colour is a soft azure blue that works for both day events and casual wear. Fabric is lightweight, suitable for Karachi and Lahore summers.",
    "Unstitched Suit",
    ["lawn", "unstitched", "3-piece", "summer", "eid"],
    ["Summer Collection", "Unstitched"],
    [v({ Size: "Unstitched" }, 4850, 34, { compareAtPrice: 6500 })],
  ),
  p(
    "embroidered-lawn-3pc-rose",
    "Embroidered Lawn 3-Piece - Rose",
    "Unstitched three piece lawn suit in dusty rose. Heavy embroidered neckline, printed dupatta. Same fabric as our Azure suit, different colourway.",
    "Unstitched Suit",
    ["lawn", "unstitched", "3-piece", "summer", "eid"],
    ["Summer Collection", "Unstitched"],
    [v({ Size: "Unstitched" }, 4850, 0, { compareAtPrice: 6500 })],
  ),
  p(
    "premium-lawn-2pc-mint",
    "Premium Lawn 2-Piece - Mint",
    "Two piece unstitched lawn. Shirt and trouser only, no dupatta. Digital print.",
    "Unstitched Suit",
    ["lawn", "unstitched", "2-piece", "summer", "budget"],
    ["Summer Collection", "Unstitched", "Under 3000"],
    [v({ Size: "Unstitched" }, 2750, 61)],
  ),
  p(
    "cotton-kurta-white",
    "Cotton Kurta - White",
    "Stitched straight cut cotton kurta with side slits. Full sleeves, round neck with a small placket. Pre-shrunk fabric, machine washable. Runs slightly loose - if you are between sizes take the smaller one.",
    "Kurta",
    ["kurta", "stitched", "cotton", "everyday", "office"],
    ["Ready to Wear"],
    sized(3200, [12, 40, 25, 6], "White"),
  ),
  p(
    "cotton-kurta-black",
    "Cotton Kurta - Black",
    "Same cut as our white cotton kurta, in black. Straight cut, side slits, full sleeves.",
    "Kurta",
    ["kurta", "stitched", "cotton", "everyday", "office"],
    ["Ready to Wear"],
    sized(3200, [0, 18, 22, 9], "Black"),
  ),
  p(
    "khaddar-kurta-olive",
    "Khaddar Kurta - Olive",
    "Winter khaddar kurta, olive green. Heavier weave, keeps you warm without a jacket indoors. Full sleeves.",
    "Kurta",
    ["kurta", "khaddar", "winter", "warm"],
    ["Winter Collection", "Ready to Wear"],
    sized(3900, [7, 15, 11, 3], "Olive"),
  ),
  p(
    "pashmina-shawl-charcoal",
    "Pashmina Shawl - Charcoal",
    "Soft woven pashmina shawl, charcoal grey with a subtle self pattern and fringed edges. 2.2 metres. Warm enough for Islamabad winters and light enough to carry.",
    "Shawl",
    ["shawl", "pashmina", "winter", "warm", "gift"],
    ["Winter Collection"],
    [v({ Size: "One Size", Color: "Charcoal" }, 5600, 19)],
  ),
  p(
    "pashmina-shawl-camel",
    "Pashmina Shawl - Camel",
    "Woven pashmina shawl in camel. Same weight as charcoal.",
    "Shawl",
    ["shawl", "pashmina", "winter", "warm", "gift"],
    ["Winter Collection"],
    [v({ Size: "One Size", Color: "Camel" }, 5600, 4)],
  ),
  p(
    "fleece-hoodie-black",
    "Fleece Hoodie - Black",
    "Unisex pullover hoodie, brushed fleece inside. Kangaroo pocket, drawstring hood, ribbed cuffs. 320 GSM - genuinely warm, not a summer-weight hoodie.",
    "Hoodie",
    ["hoodie", "winter", "unisex", "warm", "casual"],
    ["Winter Collection"],
    sized(4200, [9, 31, 27, 14], "Black"),
  ),
  p(
    "fleece-hoodie-maroon",
    "Fleece Hoodie - Maroon",
    "Same 320 GSM fleece hoodie in maroon.",
    "Hoodie",
    ["hoodie", "winter", "unisex", "warm", "casual"],
    ["Winter Collection"],
    sized(4200, [0, 6, 0, 2], "Maroon"),
  ),
  p(
    "puffer-jacket-navy",
    "Puffer Jacket - Navy",
    "Quilted puffer jacket with a water resistant shell and full zip. Two side pockets with zips, elasticated cuffs. Packs down small.",
    "Jacket",
    ["jacket", "winter", "warm", "outerwear"],
    ["Winter Collection"],
    sized(8900, [4, 11, 8, 5], "Navy"),
  ),
  p(
    "abaya-classic-black",
    "Classic Abaya - Black",
    "Nida matt abaya, plain classic cut with a front zip and wide sleeves. Falls straight, no cling. Comes with a matching hijab.",
    "Abaya",
    ["abaya", "modest", "everyday", "black"],
    ["Modest Wear"],
    [
      v({ Size: "52", Color: "Black" }, 6400, 8),
      v({ Size: "54", Color: "Black" }, 6400, 12),
      v({ Size: "56", Color: "Black" }, 6400, 5),
      v({ Size: "58", Color: "Black" }, 6400, 0),
    ],
  ),
  p(
    "embellished-abaya-navy",
    "Embellished Abaya - Navy",
    "Navy nida abaya with hand-applied stone work on the cuffs and front panel. Occasion piece. Dry clean only.",
    "Abaya",
    ["abaya", "modest", "occasion", "formal"],
    ["Modest Wear", "Occasion"],
    [
      v({ Size: "54", Color: "Navy" }, 11500, 3),
      v({ Size: "56", Color: "Navy" }, 11500, 2),
    ],
  ),
  // Deliberately thin description - real catalogs are full of these.
  p("silk-scarf-printed", "Printed Silk Scarf", "Silk scarf.", "Accessory", ["scarf", "gift"], ["Accessories"], [
    v({ Color: "Teal" }, 2200, 15),
    v({ Color: "Rust" }, 2200, 9),
  ]),
  p(
    "leather-tote-tan",
    "Leather Tote Bag - Tan",
    "Full grain leather tote with a cotton lining, one internal zip pocket and two slip pockets. Fits a 14 inch laptop. Handles are reinforced. Leather will darken with use.",
    "Bag",
    ["bag", "leather", "work", "gift"],
    ["Accessories"],
    [v({ Color: "Tan" }, 12800, 6)],
  ),
  p(
    "canvas-sneakers-white",
    "Canvas Sneakers - White",
    "Low top canvas sneakers with a vulcanised rubber sole. Unisex sizing in UK sizes.",
    "Footwear",
    ["shoes", "sneakers", "casual", "unisex"],
    ["Footwear"],
    [
      v({ Size: "UK 6" }, 3600, 5),
      v({ Size: "UK 7" }, 3600, 14),
      v({ Size: "UK 8" }, 3600, 17),
      v({ Size: "UK 9" }, 3600, 8),
      v({ Size: "UK 10" }, 3600, 0),
    ],
  ),
  p(
    "khussa-embroidered-gold",
    "Embroidered Khussa - Gold",
    "Handmade khussa with gold thread embroidery on a leather sole. Traditional pointed toe. These stretch slightly with wear - order your normal size.",
    "Footwear",
    ["khussa", "traditional", "wedding", "occasion"],
    ["Footwear", "Occasion"],
    [
      v({ Size: "36" }, 4400, 4),
      v({ Size: "37" }, 4400, 7),
      v({ Size: "38" }, 4400, 6),
      v({ Size: "39" }, 4400, 2),
    ],
  ),
  // Sold out entirely - the bot must not pretend otherwise.
  p(
    "bridal-dupatta-red",
    "Bridal Dupatta - Red",
    "Heavy zari work bridal dupatta in deep red, four sided border with hand embroidery.",
    "Dupatta",
    ["bridal", "wedding", "occasion", "heavy"],
    ["Occasion"],
    [v({ Color: "Red" }, 18500, 0)],
  ),
  p(
    "attar-oud-royal",
    "Attar - Oud Royal",
    "Alcohol free concentrated attar, 12ml roll on. Oud base with rose and a little amber. Lasts most of the day on skin.",
    "Fragrance",
    ["attar", "fragrance", "gift", "alcohol-free"],
    ["Fragrance", "Gifts"],
    [v({ Size: "12ml" }, 2900, 22)],
  ),
  p("gift-box-eid", "Eid Gift Box", "Gift box.", "Gift Set", ["gift", "eid", "bundle"], ["Gifts"], [
    v({ Size: "Standard" }, 7500, 11),
  ]),
];

export const docs: StoreDoc[] = [
  {
    kind: "shipping_policy",
    slug: "shipping",
    title: "Shipping & Delivery",
    body: [
      "We deliver all over Pakistan through Leopards and TCS.",
      "Orders placed before 4pm are dispatched the same working day.",
      "Karachi, Lahore and Islamabad: 2 to 3 working days.",
      "Other cities: 3 to 5 working days.",
      "Shipping is Rs 250 flat. Orders above Rs 5,000 ship free.",
      "Cash on Delivery is available everywhere we deliver. There is no extra COD charge.",
      "We also accept bank transfer and card payment at checkout.",
    ].join("\n"),
  },
  {
    kind: "refund_policy",
    slug: "returns",
    title: "Returns & Exchanges",
    body: [
      "You can return or exchange any unused item within 7 days of delivery.",
      "The item must be unworn, unwashed and in its original packaging with tags attached.",
      "Unstitched fabric cannot be returned once it has been cut.",
      "Sale items and fragrance are final sale and cannot be returned.",
      "To start a return, message us on WhatsApp at 0300-1234567 with your order number.",
      "Return shipping is paid by the customer unless the item arrived damaged or we sent the wrong item.",
      "Refunds are processed within 5 working days of us receiving the item back.",
    ].join("\n"),
  },
  {
    kind: "faq",
    slug: "sizing",
    title: "Size Guide",
    body: [
      "Kurtas: S fits chest 36-38, M fits 39-41, L fits 42-44, XL fits 45-47 inches.",
      "Our kurtas run slightly loose. If you are between sizes, take the smaller one.",
      "Abayas are listed in length: 52, 54, 56 and 58 inches from shoulder to hem.",
      "Hoodies are unisex and run true to size.",
      "Shoes are in UK sizes. Khussas are in Pakistani sizes and stretch slightly with wear.",
    ].join("\n"),
  },
  {
    kind: "faq",
    slug: "authenticity",
    title: "About our fabric",
    body: [
      "All our lawn is sourced from mills in Faisalabad and is 100% cotton.",
      "Our leather bags are full grain leather, not PU or bonded leather.",
      "Pashmina shawls are woven viscose-wool blend, not pure cashmere. We do not claim otherwise.",
      "Every order includes a receipt. We do not sell replicas or copies of other brands.",
    ].join("\n"),
  },
];

export const storeSnapshot: StoreSnapshot = {
  profile: {
    shopDomain: "sana-threads.myshopify.com",
    shopName: "Sana Threads",
    currency: "PKR",
    countryCode: "PK",
    about:
      "Pakistani clothing and accessories - unstitched lawn, ready to wear kurtas, modest wear, winter layers, bags and fragrance.",
  },
  settings: {
    enabled: true,
    botName: "Sana",
    brandVoice:
      "Warm and helpful like a good shop assistant. Never pushy. We would rather lose a sale than have someone return something that did not suit them.",
    register: "casual",
    greeting: "Assalam o alaikum! Kya dhoond rahe hain aap?",
    maxDiscountPercent: 0,
    codAvailable: true,
    deliveryDaysMin: 2,
    deliveryDaysMax: 5,
    escalationContact: "WhatsApp 0300-1234567",
  },
  products,
  docs,
};
