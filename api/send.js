export default async function handler(req, res) {
  // اجازه فقط برای درخواست‌های POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // دریافت اطلاعات وارد شده توسط مشتری در فرم
  const { name, email, website, category, notes } = req.body;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Digital Den <info@quizandrise.com>', 
        to: [email], // ارسال خودکار رسید به ایمیل مشتری
        subject: 'We received your project brief! - Digital Den',
        html: `
          <p>Dear <strong>${name}</strong>,</p>
          <p>Thank you for reaching out to Digital Den! We have successfully received your project brief.</p>
          <p>Our team is currently reviewing your requirements and will get back to you shortly to discuss the next steps.</p>
          <br>
          <p>Best regards,</p>
          <p>The Digital Den Team<br>Quiz & Rise Ltd</p>
        `
      })
    });

    const data = await response.json();

    // بررسی وجود خطا از سمت Resend
    if (!response.ok) {
      return res.status(response.status).json({ message: 'Error from Resend', error: data });
    }

    // پیام موفقیت‌آمیز بودن ارسال
    return res.status(200).json({ message: 'Email sent successfully', data });
    
  } catch (error) {
    // خطای سرور
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}
