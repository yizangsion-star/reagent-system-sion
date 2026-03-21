"use client";

import { signOut } from "next-auth/react";

export default function PendingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 text-yellow-500">
            <svg
              className="h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            账号待审核
          </h2>
          <p className="mt-4 text-center text-gray-600">
            您的账号正在等待管理员审核。
            <br />
            审核通过后即可登录系统使用全部功能。
          </p>
        </div>
        <div className="text-center">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            返回登录
          </button>
        </div>
      </div>
    </div>
  );
}
