export const sendToDiscord = async (time: number) => {
  const res = await fetch(
    "https://discord.com/api/webhooks/1158137368210051084/Bx1F35_TMLD7pSI1GxyXYKyZzVU1H3RxeEf4Oq82EAMjAOgsKDv-WgHFRdMx7-LO-k7F",
    {
      method: "POST",
      body: JSON.stringify({
        content: null,
        embeds: [
          {
            title: "Stand Up!!",
            description:
              "You have been sitting for " +
              parseFloat((time / 3600).toFixed(2)) +
              " hours maybe you want to get up.",
            color: 16734296,
          },
        ],
        attachments: [],
      }),
      headers: { "Content-Type": "application/json" },
    }
  );
};
