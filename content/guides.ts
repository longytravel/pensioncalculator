// Plain-English guides answering Kirsten's actual questions.
// Written for the 2026/27 tax year. Reading age 9-11. No product or
// transfer recommendations anywhere in here - guidance and questions only.

export type Guide = {
  id: string;
  question: string;
  short: string;
  body: string[];
  checklist: string[];
  askYourAccountant?: string[];
};

export const GUIDES: Guide[] = [
  {
    id: "fund-risk",
    question:
      "Do I need to look at the risk on the pension thing? I have no idea what that is on my Aviva one.",
    short:
      "Yes - a five minute check today can be worth thousands over the next sixteen years.",
    body: [
      "Every pension pot has to be invested somewhere - it isn't just sitting there as cash. When you join a pension and don't actively choose anything yourself, you get put into what's called the default fund. This is where most people end up, and it's very likely where both your Aviva pot and your People's Pension pot are sitting right now.",
      "Risk here just means: how much of your money is in company shares, which can jump around a lot from year to year but tend to grow more over a long time, versus safer things like bonds and cash, which barely move but also barely grow. Instead of a percentage, you'll usually see this described with words like cautious, balanced, adventurous or growth.",
      "Most default funds also do something called lifestyling. As you get closer to a date on file called your target retirement age, the fund automatically starts shifting your money out of shares and into safer things. This is meant to protect you from a stock market wobble right before you need the money. The catch is that it only kicks in based on the date the provider has written down for you - not necessarily the date you actually plan to retire.",
      "You're 51 now, which likely puts you around sixteen years away from being able to touch this money at all. Money that sits in cautious or safe funds this early tends to grow a lot less over sixteen years, because shares simply have more time to ride out any dips along the way. Being too cautious, too early, is its own kind of risk - the risk of ending up with a noticeably smaller pot, just a calmer-looking one on the way there.",
      "Finding out what you're actually in only takes a few minutes. Log into your Aviva online account, or the Aviva app, using your policy number - it'll be on any old statement or welcome letter. Look for a page called something like your investments or fund details. You're hunting for two things: the name of the fund you're in, and a number called your selected retirement age or target retirement date. Do exactly the same thing on your People's Pension account.",
      "If a fund name mentions the word lifestyle, or has a year in it like 2040, that's your sign it's already using this automatic wind-down system - and that year should roughly match when you actually think you'll retire, not just a guess made when the account was first opened.",
    ],
    checklist: [
      "Log into your Aviva account or app and find the page showing your current fund name.",
      "Do the same for your People's Pension account.",
      "Note the selected retirement age or target date showing on each account.",
      "Check whether either fund name includes a word like cautious, balanced or adventurous, or a target year.",
      "If a target date doesn't match when you actually plan to retire, update it - this is usually a quick online change or one phone call.",
    ],
  },
  {
    id: "peoples-pension-transfer",
    question:
      "Should I transfer my People's Pension into the Aviva one, so they're all together?",
    short:
      "Maybe - but check for guarantees and exit fees first, and compare the actual charges before deciding.",
    body: [
      "It's a completely reasonable thing to want - one pot is simpler than two. But before you move anything, there are a few things worth checking, because some of them can't be undone once you transfer.",
      "First: guarantees. Some older pension policies come with valuable extras attached, like a promised minimum growth rate or the right to a better-than-normal income later. These are uncommon on modern workplace pensions like People's Pension, but it costs nothing to ask, and if a guarantee is there, transferring away from it usually means losing it for good.",
      "Second: exit fees. Some older-style personal pensions charge a penalty for leaving. Again, this is uncommon on modern schemes like People's Pension and Aviva workplace pensions, but one phone call to check is free, and an unexpected fee is not.",
      "Third: the actual ongoing charges. People's Pension currently charges 0.5% of your pot a year, plus a flat £6.50 a year on pots over about £106 - though pots over £3,000 get a small rebate that brings this down slightly. Aviva workplace pensions are typically capped at 0.75% a year, though Aviva's own default fund often charges nearer 0.28% a year. It really depends which specific fund each of your pots happens to be sitting in.",
      "On a pot of around £10,000, the gap between something like a 0.5% charge and a 0.75% charge is only around £25 in the first year. That's genuinely small money right now. But it's charged every single year, on a pot that hopefully keeps growing, for maybe sixteen years or more - so a small yearly difference quietly adds up over that time.",
      "This isn't a case for transferring, or against it - that genuinely depends on what you find out when you ask. What follows are the exact questions to put to each provider so you get a proper answer either way.",
    ],
    checklist: [
      "Ask People's Pension: does my pension have any guarantees attached, and is there an exit fee if I transfer out?",
      "Ask Aviva the same two questions about your Aviva pot.",
      "Ask both providers for the exact current charge on your specific pot - the percentage plus any flat fee - not just the general figure on their website.",
      "Ask Aviva which fund your People's Pension money would land in if you transferred, and what that specific fund charges.",
      "Write the two numbers side by side once you have them, before deciding anything.",
    ],
  },
  {
    id: "employer-contributions",
    question:
      "It seems I can put a lot of the pension contribution straight in from the business - I'll email my accountant and ask how much I can put in from the profits, instead of out of my monthly cash.",
    short:
      "This could be the most valuable move available to you, once your accountant confirms one thing.",
    body: [
      "This is a genuinely brilliant instinct - send that email. Here's why it matters so much, and the one thing that needs checking before you count on it.",
      "Normally, getting money out of your company and into your own pocket gets taxed twice on the way: once as Corporation Tax on the company's profit, then again when you take it out as salary or a dividend. A company pension contribution skips almost all of that. The company pays money straight into your pension out of its profits, before Corporation Tax is even worked out - so it lowers the company's tax bill too. Nothing is deducted for National Insurance on either side either.",
      "It isn't limited by your salary, unlike a contribution you make yourself. A personal contribution is capped at what you actually earn in salary that year. A company contribution has no such cap - the only ceiling is the general pension Annual Allowance, £60,000 for the 2026/27 tax year, and even that can be topped up using unused allowance from the last three years, since you were already a pension member through Aviva and People's Pension.",
      "Here's what that means in real numbers. Say the company has £10,000 of spare profit. Taken out as a dividend and taxed at the higher rate, you'd end up with roughly £5,383 in your pocket after Corporation Tax and dividend tax have both taken a share. Paid straight into your pension instead, the full £10,000 goes in - no Corporation Tax, no dividend tax, nothing taken at all. That's nearly double, before the money has even had a chance to grow.",
      "Now, the one thing to check. How cleanly this works depends on something called your IR35 status - broadly, whether HMRC treats your contract with Jack & Jones as genuine self-employment (outside IR35) or more like being an employee in disguise (inside IR35). Because Jack & Jones's parent company is a large business, it's them, not you, who decides this by law, and they're required to give you a document called a Status Determination Statement setting out which applies, and why.",
      "If you're outside IR35, everything above applies in full - it's the strongest tool you have. If you're inside IR35, it gets more complicated, because tax may already have been taken off the contract income before it even reaches your company, which can leave no untaxed profit to pay into a pension the same way. That's not something to worry about tonight - it's simply the exact thing your accountant needs to check before giving you a number.",
      "So the plan is right - just make sure the email asks about IR35 status too, not only how much you can put in.",
    ],
    checklist: [
      "Send the email to your accountant, asking how much unused pension Annual Allowance you have across the last three tax years, not just this one.",
      "Ask your accountant, or your agency, to confirm your current IR35 status and show you the actual Status Determination Statement for your Jack & Jones contract.",
      "Ask your accountant to run the real numbers: what a chunk of this year's profit would net you as a dividend, compared with paying it straight into your pension.",
      "Keep paying yourself whatever salary your accountant has already set, and don't change it without asking - it may be protecting a year of your State Pension.",
    ],
    askYourAccountant: [
      "Can you show me my current IR35 status and the Status Determination Statement for my Jack & Jones contract?",
      "How much unused pension Annual Allowance do I have from the last three tax years, across all my pensions?",
      "If I put £X of this year's profit into my pension instead of taking it as a dividend, what's the actual difference in my pocket?",
      "Does my current salary level still give me a qualifying year for my State Pension?",
    ],
  },
  {
    id: "pension-vs-isa",
    question: "Can I put that contribution into my ISA I guess?",
    short:
      "You could - the real difference is that pension money is locked away till 57, ISA money isn't.",
    body: [
      "You could, yes - it's your money, and an ISA is a perfectly good place for it. Pensions and ISAs are just good at different things, so it's worth knowing the trade-off before you pick.",
      "A pension gets you tax relief going in. As covered in the last guide, a company contribution can avoid tax almost entirely on the way into your pot. An ISA gets no such top-up - what you put in is simply your own money, with nothing added on top.",
      "Where the ISA wins is access. Once money is in a pension, it's genuinely locked away - you can't touch it until you reach what's called Normal Minimum Pension Age. That's currently 55, but it's rising to 57 from April 2028. You'll be 53 by then, so 57 is the age that applies to you. An ISA, on the other hand, is available whenever you want it - next year, in five years, or tomorrow if you needed it.",
      "That matters more than it might sound. If there's any chance you'd want to slow down or stop working before 57, money in an ISA is money you could actually use to make that happen. Money in a pension can't help you at all until you get there, however much is in it.",
      "On the numbers: you can put up to £20,000 a year into ISAs in total, in the current tax year. One type worth ruling out early is the Lifetime ISA, which comes with a 25% government top-up - it isn't available to you, since you have to open one before turning 40.",
      "A lot of financial guidance points to a rough order for spare money: keep some easy-access cash for emergencies first - three to six months of costs is the usual guide, more if your income is as up-and-down as contracting can be - then take any pension contribution that comes with free money attached, then clear any expensive debt, then use pension contributions for the tax advantage, then use an ISA for anything left over you want to keep saving. It's a general guide, not a rule.",
      "This one is genuinely your call rather than a maths question - it comes down to how likely you think it is that you'll want this money before you turn 57.",
    ],
    checklist: [
      "Work out roughly how many months of costs you currently hold in easy-access savings, and whether that already covers 3 to 6 months.",
      "Check whether you're already using any of this year's £20,000 ISA allowance elsewhere.",
      "Ask yourself honestly: is there a realistic chance you'd want to stop or slow down working before you turn 57?",
      "If you're weighing up a split rather than an all-or-nothing choice, note what proportion you'd be comfortable locking away versus keeping accessible.",
    ],
  },
];
