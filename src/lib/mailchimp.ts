const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY;
const MAILCHIMP_LIST_ID = process.env.MAILCHIMP_LIST_ID;
const MAILCHIMP_SERVER_PREFIX = process.env.MAILCHIMP_SERVER_PREFIX;

export async function syncOrganiserToMailchimp(
  email: string,
  name: string,
  organisationName: string,
) {
  if (!MAILCHIMP_API_KEY || !MAILCHIMP_LIST_ID || !MAILCHIMP_SERVER_PREFIX) {
    console.warn(
      "Mailchimp credentials not configured. Skipping sync.",
    );
    return false;
  }

  try {
    const crypto = await import("crypto");
    const subscriberHash = crypto
      .createHash("md5")
      .update(email.toLowerCase())
      .digest("hex");

    const nameParts = name.trim().split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    const memberUrl = `https://${MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${MAILCHIMP_LIST_ID}/members/${subscriberHash}`;

    // Use PUT to create or update (upsert)
    const response = await fetch(memberUrl, {
      method: "PUT",
      headers: {
        Authorization: `apikey ${MAILCHIMP_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email_address: email,
        status_if_new: "subscribed",
        merge_fields: {
          FNAME: firstName,
          LNAME: lastName,
          COMPANY: organisationName,
        },
      }),
    });

    const responseData = await response.json();
    if (!response.ok) {
      console.error("Mailchimp sync failed:", responseData);
      return false;
    }

    // Add tag separately
    const tagUrl = `https://${MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${MAILCHIMP_LIST_ID}/members/${subscriberHash}/tags`;
    await fetch(tagUrl, {
      method: "POST",
      headers: {
        Authorization: `apikey ${MAILCHIMP_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tags: [{ name: "Organiser", status: "active" }],
      }),
    });

    console.log(`Mailchimp sync completed for ${email}`);
    return true;
  } catch (error) {
    console.error("Mailchimp sync error:", error);
    return false;
  }
}

export async function syncSiteUserToMailchimp(
  email: string,
  name: string,
  subjectInterests: string[],
  role: string,
) {
  if (!MAILCHIMP_API_KEY || !MAILCHIMP_LIST_ID || !MAILCHIMP_SERVER_PREFIX) {
    console.warn("Mailchimp credentials not configured. Skipping sync.");
    return false;
  }

  try {
    const crypto = await import("crypto");
    const subscriberHash = crypto
      .createHash("md5")
      .update(email.toLowerCase())
      .digest("hex");

    const nameParts = name.trim().split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    const memberUrl = `https://${MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${MAILCHIMP_LIST_ID}/members/${subscriberHash}`;

    // Use PUT to create or update (upsert)
    const response = await fetch(memberUrl, {
      method: "PUT",
      headers: {
        Authorization: `apikey ${MAILCHIMP_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email_address: email,
        status_if_new: "subscribed",
        merge_fields: {
          FNAME: firstName,
          LNAME: lastName,
          ROLE: role || "",
          INTERESTS: Array.isArray(subjectInterests) ? subjectInterests.join(", ") : "",
        },
      }),
    });

    const responseData = await response.json();
    if (!response.ok) {
      console.error("Mailchimp sync failed:", responseData);
      return false;
    }

    // Add tag separately
    const tagUrl = `https://${MAILCHIMP_SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${MAILCHIMP_LIST_ID}/members/${subscriberHash}/tags`;
    await fetch(tagUrl, {
      method: "POST",
      headers: {
        Authorization: `apikey ${MAILCHIMP_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tags: [{ name: "Site User", status: "active" }],
      }),
    });

    console.log(`Mailchimp site user sync completed for ${email}`);
    return true;
  } catch (error) {
    console.error("Mailchimp site user sync error:", error);
    return false;
  }
}
