export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { name, email, website, category, notes } = req.body;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Digital Den <onboarding@resend.dev>',
        to: 'hamidmashhoon@gmail.com', 
        subject: `پروژه جدید: ${category} از طرف ${name}`,
        html: `
          <h3>درخواست جدید از طرف فرم Digital Den</h3>
          <p><strong>نام/شرکت:</strong> ${name}</p>
          <p><strong>ایمیل مشتری:</strong> ${email}</p>
          <p><strong>وب‌سایت:</strong> ${website}</p>
          <p><strong>دسته‌بندی خدمات:</strong> ${category}</p>
          <p><strong>توضیحات:</strong> ${notes}</p>
        `
      })
    });

    const data = await response.json();

    if (response.ok) {
      res.status(200).json({ success: true, data });
    } else {
      res.status(400).json({ success: false, data });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
