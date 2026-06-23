// netlify/functions/absage.js

exports.handler = async (event) => {

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const { vorname, email, kursart, termine } = JSON.parse(event.body);

    const termineHtml = termine.map(t => `
      <tr>
        <td style="padding: 8px 14px; border-top: 1px solid #e2d8d0; font-weight: 600;">${t.datum}</td>
        <td style="padding: 8px 14px; border-top: 1px solid #e2d8d0;">
          <span style="color: ${t.meldung === 'Absage' ? '#7a3f3a' : '#4a7a5a'}; font-weight: 600;">${t.meldung}</span>
        </td>
      </tr>
    `).join('');

    const karoHtml = `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #2a1a1a;">
        <h2 style="color: #7a3f3a; margin-bottom: 4px;">📬 Neue Kursmeldung</h2>
        <p style="color: #8a7060; font-size: 13px; margin-bottom: 24px;">eingegangen über das Absage-Formular</p>
        <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
          <tr>
            <td style="padding: 10px 14px; background: #f8f4f0; font-weight: 600; width: 40%;">Name</td>
            <td style="padding: 10px 14px; background: #f8f4f0;">${vorname}</td>
          </tr>
          <tr>
            <td style="padding: 10px 14px; border-top: 1px solid #e2d8d0; font-weight: 600;">E-Mail</td>
            <td style="padding: 10px 14px; border-top: 1px solid #e2d8d0;">
              <a href="mailto:${email}" style="color: #7a3f3a;">${email}</a>
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 14px; border-top: 1px solid #e2d8d0; font-weight: 600;">Kurs</td>
            <td style="padding: 10px 14px; border-top: 1px solid #e2d8d0;">${kursart}</td>
          </tr>
          ${termineHtml}
        </table>
      </div>
    `;

    const karoRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Kursformular <onboarding@resend.dev>',
        to: [process.env.NOTIFY_TO],
        subject: `Kursmeldung von ${vorname} – ${kursart}`,
        html: karoHtml,
      }),
    });

    if (!karoRes.ok) {
      const err = await karoRes.text();
      console.error('Resend Fehler:', err);
      return { statusCode: 500, body: 'Mail-Versand fehlgeschlagen' };
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };

  } catch (err) {
    console.error('Fehler:', err);
    return { statusCode: 500, body: 'Serverfehler' };
  }
};