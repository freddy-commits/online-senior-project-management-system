'use client'

import { NextIntlClientProvider } from 'next-intl'
import React from 'react'

export function I18nProvider({ messages, locale, children }: any) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  )
}
