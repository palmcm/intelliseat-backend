export const sendToDiscord = async (time: number) => {
  const res = await fetch(process.env.DISCORD_WEBHOOK_URL as string, {
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
      username: "Intelliseat",
      attachments: [],
    }),
    headers: { "Content-Type": "application/json" },
  });
};
