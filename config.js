/* =====================================================================
   VILLA MISAN — SITE SETTINGS
   This is the only file you need to edit for day-to-day changes:
   prices, booked weeks, booking period, contact details.
   ===================================================================== */

window.VILLA = {
  name: "Villa Misan",
  location: "Bokordići, Istria, Croatia",

  contact: {
    email: "villamisan1@gmail.com", // where booking requests are sent
    phone: "Whatsapp (+385951970195)",
    whatsapp: "+385951970195", // digits only, used for the WhatsApp link
    address: "Bokordići 28b, 52342 Svetvinčenat, Croatia",
  },

  // Optional: create a free form at https://formspree.io and paste its URL here,
  // e.g. "https://formspree.io/f/abcdwxyz". Requests then arrive in your inbox
  // without the guest needing an email app. Leave empty to use a normal email link.
  formEndpoint: "",

  // Shown in the footer. Croatian law requires the accommodation category and decision number.
  legal: {
    category: "Holiday house ★★★★★",
  },

  facts: {
    guests: 11,
    bedrooms: 5,
    bathrooms: 5,
    pool: "32 m²",
  },

  /* ---------- BOOKING PERIOD ----------
     Guests can only book inside these dates. Both must be Saturdays.
     Change these each year when you open the next season.            */
  open: { from: "2027-05-01", to: "2027-10-02" },
  checkIn: "16:00", // Saturday
  checkOut: "10:00", // Saturday

  /* ---------- PRICES (per week, Saturday to Saturday) ----------
     Seasons repeat every year. "from" and "to" are MM-DD and include both days.
     A week is charged at the season its arrival Saturday falls in.
     PLACEHOLDER PRICES: replace with your own.                                  */
  currency: "€",
  seasons: [
    {
      name: "Pre-season / Post-season",
      from: "05-01",
      to: "06-11",
      price: 1600,
    },
    { name: "Mid-season", from: "05-29", to: "06-25", price: 2000 },
    { name: "High season", from: "06-26", to: "07-02", price: 2800 },
    { name: "Peak season", from: "07-03", to: "08-20", price: 3200 },
    { name: "High season", from: "08-21", to: "08-27", price: 2800 },
    { name: "Mid-season", from: "08-28", to: "09-10", price: 2000 },
    {
      name: "Pre-season / Post-season",
      from: "09-11",
      to: "10-02",
      price: 1600,
    },
  ],
  securityDeposit: 300,

  /* ---------- BOOKED WEEKS ----------
     "from" = arrival Saturday, "to" = departure Saturday. Format YYYY-MM-DD.
     Add a line for every booking, including ones from the agency.
     The two lines below are EXAMPLES: delete them before going live.        */
  booked: [
    { from: "2027-07-17", to: "2027-07-31" },
    { from: "2027-08-14", to: "2027-08-21" },
  ],

  /* ---------- GALLERY ----------
     The first 5 photos show on the page, the rest open in the viewer.
     To add a photo: put it in the "images" folder and add a line here.
     Change the order of the lines to change the order of the photos.   */
  gallery: [
    "images/25.jpg",
    "images/23.jpg",
    "images/29.jpg",
    "images/gallery-1.jpg",
    "images/3.jpg",
    "images/4.jpg",
    "images/5.jpg",
    "images/6.jpg",
    "images/8.jpg",
    "images/20.jpg",
    "images/21.jpg",
    "images/10.jpg",
    "images/12.jpg",
    "images/13.jpg",
    "images/15.jpg",
    "images/17.jpg",
    "images/19.jpg",
    "images/11.jpg",
    "images/14.jpg",
    "images/16.jpg",
    "images/18.jpg",
    "images/9.jpg",
    "images/26.jpg",
    "images/27.jpg",
    "images/28.jpg",
  ],
};
