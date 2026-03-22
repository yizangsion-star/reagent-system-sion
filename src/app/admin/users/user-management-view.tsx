"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";

interface User {
  id: string;
  username: string;
  role: string;
  isApproved: boolean;
  createdAt: string;
}

export default function UserManagementView({ users }: { users: User[] }) {
  const [userList, setUserList] = useState(users);
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleApprove = async (userId: string) => {
    setLoading(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action: "approve" }),
      });
      const data = await res.json();
      if (res.ok) {
        setUserList(userList.map((u) => u.id === userId ? { ...u, isApproved: true } : u));
        setMessage("审核成功");
      } else {
        setMessage(data.error || "操作失败");
      }
    } catch (err) {
      setMessage("操作失败，请稍后重试");
    } finally {
      setLoading(null);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleToggleRole = async (userId: string, currentRole: string) => {
    setLoading(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId, 
          action: currentRole === "ADMIN" ? "remove_admin" : "make_admin" 
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setUserList(userList.map((u) => 
          u.id === userId ? { ...u, role: currentRole === "ADMIN" ? "STUDENT" : "ADMIN" } : u
        ));
        setMessage("权限更新成功");
      } else {
        setMessage(data.error || "操作失败");
      }
    } catch (err) {
      setMessage("操作失败，请稍后重试");
    } finally {
      setLoading(null);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleDelete = async (userId: string) => {
    setLoading(userId);
    try {
      const res = await fetch(`/api/admin/users?userId=${userId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        setUserList(userList.filter((u) => u.id !== userId));
        setMessage("用户已删除");
        setDeleteConfirm(null);
      } else {
        setMessage(data.error || "删除失败");
      }
    } catch (err) {
      setMessage("删除失败，请稍后重试");
    } finally {
      setLoading(null);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 顶部导航栏 */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">试剂管理系统 - 成员管理</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-sm text-indigo-600 hover:text-indigo-500">
                返回仪表盘
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="text-sm text-red-600 hover:text-red-500"
              >
                退出
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {message && (
          <div className="mb-4 rounded-md bg-green-50 p-4">
            <div className="text-sm text-green-700">{message}</div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">用户列表</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    用户名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    角色
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    注册时间
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {userList.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          user.role === "ADMIN"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {user.role === "ADMIN" ? "管理员" : "学生"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          user.isApproved
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {user.isApproved ? "已审核" : "待审核"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString("zh-CN")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      {!user.isApproved && (
                        <button
                          onClick={() => handleApprove(user.id)}
                          disabled={loading === user.id}
                          className="text-green-600 hover:text-green-900 disabled:opacity-50"
                        >
                          {loading === user.id ? "处理中..." : "通过审核"}
                        </button>
                      )}
                      <button
                        onClick={() => handleToggleRole(user.id, user.role)}
                        disabled={loading === user.id}
                        className="text-indigo-600 hover:text-indigo-900 disabled:opacity-50"
                      >
                        {loading === user.id
                          ? "处理中..."
                          : user.role === "ADMIN"
                          ? "取消管理员"
                          : "设为管理员"}
                      </button>
                      {deleteConfirm === user.id ? (
                        <>
                          <button
                            onClick={() => handleDelete(user.id)}
                            disabled={loading === user.id}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50 font-bold"
                          >
                            {loading === user.id ? "删除中..." : "确认删除"}
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            disabled={loading === user.id}
                            className="text-gray-600 hover:text-gray-900 disabled:opacity-50"
                          >
                            取消
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(user.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          删除
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}