export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { name, email, website, category, notes } = req.body;

  try {
    // ۱. ارسال رسید شیک برای مشتری
    const customerEmail = fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Digital Den <info@quizandrise.com>', 
        to: [email], 
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

    // ۲. ارسال اطلاعات کامل پروژه برای شرکت (تیم شما)
    const companyEmail = fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Digital Den System <info@quizandrise.com>',
        to: ['info@quizandrise.com'], // این پیام به ایمیل سازمانی شما می‌آید
        subject: `New Project Request: ${name} - ${category}`,
        html: `
          <h2>یک درخواست پروژه جدید ثبت شد!</h2>
          <p><strong>نام مشتری:</strong> ${name}</p>
          <p><strong>ایمیل مشتری:</strong> ${email}</p>
          <p><strong>وب‌سایت:</strong> ${website || 'وارد نشده'}</p>
          <p><strong>دسته‌بندی:</strong> ${category}</p>
          <p><strong>توضیحات:</strong> ${notes}</p>
        `
      })
    });

    // اجرای همزمان هر دو دستور ارسال
    const [customerResponse, companyResponse] = await Promise.all([customerEmail, companyEmail]);

    if (!customerResponse.ok || !companyResponse.ok) {
      return res.status(500).json({ message: 'خطا در ارسال یکی از ایمیل‌ها' });
    }

    return res.status(200).json({ message: 'ایمیل‌ها با موفقیت ارسال شدند' });
    
  } catch (error) {
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}
