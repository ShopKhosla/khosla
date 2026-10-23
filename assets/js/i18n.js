/* English / Arabic toggle.

   The page ships in English. Clicking the Arabic button swaps the text in
   place and flips the layout to right-to-left; clicking English puts it back.
   The choice is deliberately not remembered, so every page opens in English.

   Translations are keyed on the English text itself, which keeps the
   dictionary readable and means a string that appears on several pages only
   needs translating once. Only the text nodes are rewritten, so the inline
   styles carried over from the original site survive untouched. */
(function () {
  'use strict';

  /* Elements that hold visible copy. Lists are excluded because their items
     are collected individually, and anything inside a review is customer
     writing that must never be translated. */
  var SEL = 'h1.t,h2.t,h3.t,h4.t,h5.t,h6.t,p.t,li,.nav__brand,.nav__link,'
          + '.skip-link,button,a.button,.form__label,.order-intro,.price,'
          + '.prices .size,.prices .amount,.reviews__empty';
  var SKIP = '.review,[data-reviews] .review,.form__status,.lang';

  var AR = {
    /* chrome */
    'Skip to main content': 'تخطَّ إلى المحتوى الرئيسي',
    'Khosla': 'خوسلا',
    'Home': 'الرئيسية',
    'About': 'من نحن',
    'Testimonials': 'آراء العملاء',
    'Contact': 'تواصلي معنا',

    /* home */
    'Khosla is a haircare brand built on natural ingredients that nourish and deeply moisturize for healthier-looking hair.':
      'خوسلا علامة للعناية بالشعر قائمة على مكوّنات طبيعية تغذّي الشعر وترطّبه بعمق ليبدو أكثر صحة.',
    'Tallow Cream': 'كريم كركار',
    'Leave In': 'ليف إن',
    'Hair oil': 'زيت الشعر',
    'Place an Order': 'اطلبي الآن',
    'Place an order': 'اطلبي الآن',
    'Message us with the products, sizes and quantities you’d like and where to ship them. We’ll reply with your total and payment details, and your order ships as soon as payment is received.':
      'راسلينا وأخبرينا بالمنتجات والأحجام والكميات التي ترغبين بها وعنوان الشحن. سنرد عليكِ بإجمالي الطلب وتفاصيل الدفع، ويُشحن طلبك فور استلام المبلغ.',
    'Stay Connected': 'ابقي على تواصل',
    'Get product updates, exclusive discounts, and skincare inspiration delivered straight to your inbox.':
      'اشتركي لتصلك آخر أخبار المنتجات وعروض حصرية وأفكار للعناية ببشرتك مباشرة إلى بريدك.',
    'Email address': 'البريد الإلكتروني',
    'Subscribe': 'اشتراك',

    /* footer */
    'Quick Link': 'روابط سريعة',
    'About Khosla': 'عن خوسلا',
    'Terms of Policy': 'الشروط والأحكام',
    'Privacy Policy': 'سياسة الخصوصية',
    'Contact Information': 'بيانات التواصل',
    'FAQ': 'الأسئلة الشائعة',
    'Shipping Policy': 'سياسة الشحن',
    'Facebook': 'فيسبوك',
    'Instagram': 'إنستغرام',

    /* about */
    'How To Use': 'طريقة الاستخدام',
    'Ingredients': 'المكوّنات',
    'Getting the best results from your Khosla products starts with consistency and proper application.':
      'أفضل نتيجة من منتجات خوسلا تبدأ بالانتظام وبطريقة الاستخدام الصحيحة.',
    'Step 1: Apply': 'الخطوة 1: ضعي المنتج',
    'Follow the instructions provided for your specific product. Apply the recommended amount evenly through your hair or scalp.':
      'اتبعي التعليمات الخاصة بكل منتج، وضعي الكمية الموصى بها بالتساوي على الشعر أو فروة الرأس.',
    'Step 2: Massage': 'الخطوة 2: دلّكي',
    'Take time to gently massage products into your hair or scalp when recommended to encourage even coverage.':
      'خذي وقتك في تدليك المنتج برفق على الشعر أو فروة الرأس عند الحاجة، ليتوزّع بالتساوي.',
    'Step 3: Stay Consistent': 'الخطوة 3: واظبي',
    'Healthy hair takes time. Consistent use and a proper routine are key to supporting your hair goals.':
      'الشعر الصحي يحتاج وقتًا. الاستخدام المنتظم والروتين المناسب هما مفتاح الوصول إلى هدفك.',
    'Tips For Healthy Hair': 'نصائح لشعر صحي',
    'Be gentle when brushing and styling': 'كوني لطيفة عند تمشيط الشعر وتصفيفه',
    'Avoid excessive heat damage': 'تجنّبي الإفراط في استخدام الحرارة',
    'Maintain a consistent haircare routine': 'حافظي على روتين ثابت للعناية بالشعر',
    'Your hair journey is unique — Khosla is here to support you along the way.':
      'رحلة شعرك فريدة، وخوسلا هنا لمرافقتك في كل خطوة.',

    /* testimonials */
    'Share your Hair Journey': 'شاركينا رحلة شعرك',
    'We\'d love to hear about your experience with Khosla. Leave a testimonial below and let others know how our products worked for you.':
      'يسعدنا أن نسمع عن تجربتك مع خوسلا. اتركي رأيك أدناه ليعرف الآخرون كيف ساعدتك منتجاتنا.',
    'Your name': 'اسمك',
    'Your review': 'رأيك',
    'Post review': 'أرسلي رأيك',
    'No reviews yet. Be the first to share your experience.':
      'لا توجد آراء بعد. كوني أول من يشارك تجربتها.',

    /* contact */
    'Contact Us': 'تواصلي معنا',
    'How to Place an Order': 'كيف تطلبين',
    'Use the form below to place an order or ask us a question.':
      'استخدمي النموذج أدناه لإرسال طلبك أو لطرح أي سؤال.',
    'Name': 'الاسم',
    'Message': 'الرسالة',
    'Send message': 'إرسال',
    'Prefer email?': 'تفضّلين البريد الإلكتروني؟',

    /* faq */
    'Frequently Asked Questions': 'الأسئلة الشائعة',
    'What is Khosla?': 'ما هي خوسلا؟',
    'Khosla is a haircare brand created to support healthier, stronger, and more nourished hair through carefully selected ingredients and thoughtful formulations.':
      'خوسلا علامة للعناية بالشعر أُنشئت لدعم شعر أكثر صحة وقوة وتغذية، من خلال مكوّنات مختارة بعناية وتركيبات مدروسة.',
    'How often should I use Khosla products?': 'كم مرة أستخدم منتجات خوسلا؟',
    'Usage depends on the product and your hair needs. Follow the recommended directions provided with each product for the best results.':
      'يعتمد ذلك على المنتج وعلى احتياج شعرك. اتبعي التعليمات المرفقة مع كل منتج للحصول على أفضل نتيجة.',
    'How long does it take to see results?': 'متى تظهر النتائج؟',
    'Everyone’s hair journey is different. Consistent use, proper application, and a healthy hair routine play an important role in achieving your desired results.':
      'رحلة كل شعر مختلفة. الاستخدام المنتظم والتطبيق الصحيح وروتين العناية السليم كلها عوامل مهمة للوصول إلى النتيجة التي تريدينها.',
    'Are Khosla products suitable for all hair types?': 'هل منتجات خوسلا مناسبة لجميع أنواع الشعر؟',
    'Our products are designed to support a variety of hair types. However, everyone\'s hair is unique, so we recommend choosing products based on your individual hair goals and needs.':
      'منتجاتنا مصمّمة لتناسب أنواعًا متعددة من الشعر. ومع ذلك، شعر كل شخص مختلف، لذا ننصح باختيار المنتج بحسب احتياجك وأهدافك.',
    'Are your products tested on animals?': 'هل تُختبر منتجاتكم على الحيوانات؟',
    'Khosla is committed to responsible and ethical practices.':
      'خوسلا ملتزمة بممارسات مسؤولة وأخلاقية.',
    'Can I return a product?': 'هل يمكنني إرجاع منتج؟',
    'Get in touch and we will sort it out with you.': 'تواصلي معنا وسنحل الأمر معك.',
    'How can I contact Khosla?': 'كيف أتواصل مع خوسلا؟',
    'You can reach us at:': 'يمكنك التواصل معنا عبر:',

    /* products */
    'Khosla Tallow Cream': 'كريم كركار من خوسلا',
    'Khosla Leave In': 'ليف إن من خوسلا',
    'Khosla Hair Oil': 'زيت الشعر من خوسلا',
    '250 g': '250 جم',
    '500 g': '500 جم',
    '1000 g': '1000 جم',
    '100 ml': '100 مل',
    '250 EGP': '250 ج.م',
    '300 EGP': '300 ج.م',
    '500 EGP': '500 ج.م',
    '550 EGP': '550 ج.م',
    '600 EGP': '600 ج.م',
    '1,100 EGP': '1,100 ج.م',
    '1,150 EGP': '1,150 ج.م',
    '250 – 1,100 EGP': '250 – 1,100 ج.م',
    '300 – 1,150 EGP': '300 – 1,150 ج.م',

    /* terms */
    'Terms of Service': 'شروط الخدمة',
    'Welcome to Khosla. By using our website, you agree to the following terms and conditions.':
      'أهلًا بك في خوسلا. باستخدامك لموقعنا فإنك توافقين على الشروط والأحكام التالية.',
    'Website Use': 'استخدام الموقع',
    'You agree to use our website for lawful purposes and not to misuse our content, products, or services.':
      'توافقين على استخدام الموقع لأغراض مشروعة، وعلى عدم إساءة استخدام محتوانا أو منتجاتنا أو خدماتنا.',
    'Products': 'المنتجات',
    'We strive to display our products and information accurately. However, colors, packaging, and product availability may vary.':
      'نحرص على عرض منتجاتنا ومعلوماتها بدقة. ومع ذلك قد تختلف الألوان والتغليف ومدى توفّر المنتج.',
    'Orders': 'الطلبات',
    'By placing an order, you agree to provide accurate information and authorize payment for your purchase.':
      'بإتمامك الطلب، توافقين على تقديم بيانات صحيحة وعلى تفويض الدفع لعملية الشراء.',
    'Khosla reserves the right to cancel or refuse orders if necessary.':
      'تحتفظ خوسلا بحق إلغاء أو رفض الطلبات عند الضرورة.',
    'Intellectual Property': 'الملكية الفكرية',
    'All website content, including images, logos, text, and branding, belongs to Khosla and may not be used without permission.':
      'جميع محتويات الموقع، بما فيها الصور والشعارات والنصوص والهوية البصرية، ملك لخوسلا ولا يجوز استخدامها دون إذن.',
    'Disclaimer': 'إخلاء مسؤولية',
    'Results from haircare products may vary from person to person. Individual results depend on factors such as hair type, routine, and consistency of use.':
      'قد تختلف نتائج منتجات العناية بالشعر من شخص لآخر، وتعتمد على عوامل مثل نوع الشعر والروتين المتبع وانتظام الاستخدام.',
    'Changes to Terms': 'تعديل الشروط',
    'Khosla reserves the right to update these terms at any time. Changes will be posted on this page.':
      'تحتفظ خوسلا بحق تحديث هذه الشروط في أي وقت، وتُنشر التعديلات على هذه الصفحة.',
    'For questions about these Terms of Service, contact us at:':
      'لأي استفسار بخصوص شروط الخدمة، تواصلي معنا عبر:',

    /* privacy */
    'At Khosla, we respect your privacy and are committed to protecting your personal information.':
      'في خوسلا نحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية.',
    'Information We Collect': 'البيانات التي نجمعها',
    'When you visit our website, place an order, subscribe to our emails, or contact us, we may collect information such as:':
      'عند زيارتك للموقع أو إتمام طلب أو الاشتراك في رسائلنا أو التواصل معنا، قد نجمع بيانات مثل:',
    'Shipping information': 'بيانات الشحن',
    'Order details': 'تفاصيل الطلب',
    'How We Use Your Information': 'كيف نستخدم بياناتك',
    'We use your information to:': 'نستخدم بياناتك من أجل:',
    'Process and fulfill orders': 'معالجة الطلبات وتنفيذها',
    'Communicate with you about your purchases': 'التواصل معك بشأن مشترياتك',
    'Send updates, promotions, and offers (if you choose to subscribe)':
      'إرسال التحديثات والعروض (في حال اخترت الاشتراك)',
    'Improve our website and customer experience': 'تحسين الموقع وتجربة العملاء',
    'Protecting Your Information': 'حماية بياناتك',
    'We take reasonable steps to protect your personal information and do not sell your personal information to third parties.':
      'نتخذ خطوات معقولة لحماية بياناتك الشخصية، ولا نبيع بياناتك لأي طرف ثالث.',
    'Cookies': 'ملفات تعريف الارتباط',
    'Our website may use cookies to improve your browsing experience and understand how visitors use our website.':
      'قد يستخدم موقعنا ملفات تعريف الارتباط لتحسين تجربة التصفح ولفهم كيفية استخدام الزوار للموقع.',
    'Third-Party Services': 'خدمات الأطراف الثالثة',
    'We may use trusted third-party services to help operate our website, such as handling messages sent through our contact form and storing customer reviews.':
      'قد نستعين بخدمات موثوقة من أطراف ثالثة لتشغيل الموقع، مثل استقبال الرسائل المُرسلة عبر نموذج التواصل وتخزين آراء العملاء.',
    'If you have questions about this Privacy Policy, contact us at:':
      'لأي استفسار بخصوص سياسة الخصوصية، تواصلي معنا عبر:',

    /* shipping */
    'At Khosla, we are committed to getting your haircare products to you safely and efficiently.':
      'في خوسلا نحرص على وصول منتجات العناية بشعرك إليك بأمان وسرعة.',
    'Shipping Time': 'مدة الشحن',
    'Shipping times may vary depending on your location. Once your order has shipped, you will receive tracking information when available.':
      'قد تختلف مدة الشحن حسب موقعك. وبمجرد شحن طلبك ستصلك بيانات التتبع عند توفرها.',
    'Shipping Delays': 'تأخر الشحن',
    'While we do our best to ensure timely delivery, delays may occur due to shipping carriers, weather conditions, holidays, or other circumstances outside of our control.':
      'رغم حرصنا على التسليم في الوقت المحدد، قد يحدث تأخير بسبب شركات الشحن أو الأحوال الجوية أو العطلات أو ظروف خارجة عن إرادتنا.',
    'Incorrect Shipping Information': 'بيانات شحن غير صحيحة',
    'Please make sure your shipping address is correct before placing your order. Khosla is not responsible for orders shipped to an incorrect address provided by the customer.':
      'يرجى التأكد من صحة عنوان الشحن قبل إتمام الطلب. خوسلا غير مسؤولة عن الطلبات المشحونة إلى عنوان خاطئ قدّمه العميل.',
    'Lost or Damaged Packages': 'الطرود المفقودة أو التالفة',
    'If your package is lost or arrives damaged, please contact us as soon as possible with your order information so we can assist you.':
      'إذا فُقد طردك أو وصل تالفًا، يرجى التواصل معنا بأسرع وقت مع بيانات طلبك لنتمكن من مساعدتك.',
    'For any shipping questions, please contact us at:':
      'لأي استفسار عن الشحن، تواصلي معنا عبر:',

    /* Messages the forms and the reviews put on the page as you use them.
       They are looked up through KhoslaI18n.t() rather than swapped in the
       DOM, because they do not exist until something happens. */
    'Sending…': 'جارٍ الإرسال…',
    'Thanks for subscribing. Check your inbox.': 'شكرًا لاشتراكك.',
    'Thanks for your message. We’ll reply by email.':
      'شكرًا لرسالتك. سنرد عليك بالبريد الإلكتروني.',
    'Something went wrong. Please try again.': 'حدث خطأ ما. يرجى المحاولة مرة أخرى.',
    'Could not send. Check your connection and try again.':
      'تعذّر الإرسال. تحقّقي من اتصالك وحاولي مرة أخرى.',
    'Thank you. Your review has been posted.': 'شكرًا لك. تم نشر رأيك.',
    'Could not post your review. Please try again in a moment.':
      'تعذّر نشر رأيك. يرجى المحاولة بعد قليل.',
    'Please enter your name (60 characters or fewer).':
      'يرجى إدخال اسمك (60 حرفًا كحد أقصى).',
    'You have just submitted a review. Please wait a minute before sending another.':
      'لقد أرسلتِ رأيًا للتو. يرجى الانتظار دقيقة قبل إرسال رأي آخر.'
  };

  /* Paragraphs that contain links. Keyed on the English text, but the value is
     markup, because the link has to survive the swap. */
  var AR_HTML = {
    'Every Khosla product is built on natural, vitamin-rich ingredients chosen to deeply moisturize and nourish. Want the full list for a particular product? Message us and we’ll send it over.':
      'كل منتج من خوسلا قائم على مكوّنات طبيعية غنية بالفيتامينات، مختارة لترطيب الشعر وتغذيته بعمق. تريدين القائمة الكاملة لمنتج معيّن؟ <a href="contact.html">راسلينا</a> وسنرسلها إليك.',
    'Write to us at khoslanatural@gmail.com and we’ll reply as soon as we can.':
      'راسلينا على <a href="mailto:khoslanatural@gmail.com">khoslanatural@gmail.com</a> وسنرد في أقرب وقت.',
    'khoslanatural@gmail.com, or send us a message through our contact form.':
      '<a href="mailto:khoslanatural@gmail.com">khoslanatural@gmail.com</a>، أو راسلينا عبر <a href="contact.html">نموذج التواصل</a>.'
  };

  var ATTRS = {
    'Main': 'القائمة الرئيسية',
    'Show slide 1': 'عرض الشريحة 1',
    'Show slide 2': 'عرض الشريحة 2',
    'Show slide 3': 'عرض الشريحة 3',
    'Slide 1 of 2': 'شريحة 1 من 2',
    'Slide 2 of 2': 'شريحة 2 من 2',
    'Slide 1 of 3': 'شريحة 1 من 3',
    'Slide 2 of 3': 'شريحة 2 من 3',
    'Slide 3 of 3': 'شريحة 3 من 3'
  };

  var TITLES = {
    'Khosla - Home': 'خوسلا - الرئيسية',
    'Khosla - About': 'خوسلا - من نحن',
    'Khosla - Testimonials': 'خوسلا - آراء العملاء',
    'Khosla - Contact': 'خوسلا - تواصلي معنا',
    'Khosla - FAQ': 'خوسلا - الأسئلة الشائعة',
    'Khosla - Tallow Cream': 'خوسلا - كريم كركار',
    'Khosla - Leave In': 'خوسلا - ليف إن',
    'Khosla - Khosla Hair Oil': 'خوسلا - زيت الشعر',
    'Khosla - Terms of Policy': 'خوسلا - الشروط والأحكام',
    'Khosla - Privacy Policy': 'خوسلا - سياسة الخصوصية',
    'Khosla - Shipping Policy': 'خوسلا - سياسة الشحن'
  };

  function norm(s) { return (s || '').replace(/\s+/g, ' ').trim(); }

  /* Elements to translate: everything matching SEL that does not itself
     contain another match, so a list item wrapping a link is left alone and
     the link is translated instead. */
  function targets() {
    var all = [].slice.call(document.querySelectorAll(SEL));
    return all.filter(function (el) {
      if (el.closest(SKIP)) return false;
      return !el.querySelector(SEL);
    });
  }

  /* Put the whole translation in the first text node and empty the rest. The
     wrapping spans, and the styles on them, are left exactly as they were. */
  function setText(el, value) {
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    var nodes = [], n;
    while ((n = walker.nextNode())) if (norm(n.nodeValue)) nodes.push(n);
    if (!nodes.length) { el.textContent = value; return; }
    nodes[0].nodeValue = value;
    for (var i = 1; i < nodes.length; i++) nodes[i].nodeValue = '';
  }

  var original = new WeakMap();
  var current = 'en';

  function apply(lang) {
    targets().forEach(function (el) {
      if (!original.has(el)) original.set(el, { html: el.innerHTML, text: norm(el.textContent) });
      var keep = original.get(el);
      if (lang === 'ar') {
        if (AR_HTML[keep.text]) el.innerHTML = AR_HTML[keep.text];
        else if (AR[keep.text]) setText(el, AR[keep.text]);
      } else {
        el.innerHTML = keep.html;
      }
    });

    /* dataset keys are camelCase and cannot contain a hyphen, so aria-label
       is stashed as data-i18n-aria-label via its camelCase name. */
    [['aria-label', 'i18nAriaLabel'], ['placeholder', 'i18nPlaceholder']].forEach(function (pair) {
      var attr = pair[0], key = pair[1];
      [].slice.call(document.querySelectorAll('[' + attr + ']')).forEach(function (el) {
        if (!el.dataset[key]) el.dataset[key] = el.getAttribute(attr);
        var en = el.dataset[key];
        el.setAttribute(attr, lang === 'ar' && ATTRS[en] ? ATTRS[en] : en);
      });
    });

    if (!document.documentElement.dataset.titleEn) {
      document.documentElement.dataset.titleEn = document.title;
    }
    var titleEn = document.documentElement.dataset.titleEn;
    document.title = lang === 'ar' && TITLES[titleEn] ? TITLES[titleEn] : titleEn;

    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

    [].slice.call(document.querySelectorAll('.lang__btn')).forEach(function (b) {
      var on = b.getAttribute('data-lang') === lang;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });

    current = lang;
  }

  [].slice.call(document.querySelectorAll('.lang__btn')).forEach(function (b) {
    b.addEventListener('click', function () { apply(b.getAttribute('data-lang')); });
  });

  /* Reviews arrive after the page has loaded, so they need translating too.
     Only the furniture is touched; the reviews themselves are left as written. */
  window.KhoslaI18n = {
    lang: function () { return current; },
    /* Translate a string the page produces at runtime, such as a form status. */
    t: function (s) { return current === 'ar' && AR[s] ? AR[s] : s; },
    refresh: function () { if (current === 'ar') apply('ar'); }
  };
})();
