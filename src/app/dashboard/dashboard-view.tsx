"use client";

import { useState, useEffect } from "react";
import { Session } from "next-auth";
import { signOut } from "next-auth/react";

interface OrderGroup {
  id: string;
  userId: string;
  month: string;
  supplierName: string;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  isVerified: boolean;
  isReimbursed: boolean;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    username: string;
  };
  orderItems: OrderItem[];
}

interface OrderItem {
  id: string;
  orderGroupId: string;
  reagentName: string;
  type: "PUBLIC_REAGENT" | "PERSONAL_REAGENT";
  price: number;
  orderDate: string;
}

interface Student {
  id: string;
  username: string;
}

interface DashboardViewProps {
  session: Session;
  months: string[];
  students: Student[];
}

export default function DashboardView({
  session,
  months,
  students,
}: DashboardViewProps) {
  const userRole = (session.user as any)?.role || "STUDENT";
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [orderGroups, setOrderGroups] = useState<OrderGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // 获取当前年月作为默认月份
  const getCurrentMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  };

  // 初始化默认月份
  useEffect(() => {
    if (months.length > 0 && !selectedMonth) {
      setSelectedMonth(months[0]);
    } else if (months.length === 0) {
      setSelectedMonth(getCurrentMonth());
    }
  }, [months]);

  // 加载订单数据
  useEffect(() => {
    if (selectedMonth) {
      loadOrderGroups();
    }
  }, [selectedMonth, selectedUserId]);

  const loadOrderGroups = async () => {
    setLoading(true);
    try {
      let url = `/api/orders?month=${selectedMonth}`;
      if (selectedUserId && userRole === "ADMIN") {
        url += `&userId=${selectedUserId}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setOrderGroups(data);
      }
    } catch (error) {
      console.error("加载订单失败:", error);
    } finally {
      setLoading(false);
    }
  };

  // 计算总金额
  const calculateTotal = (group: OrderGroup) => {
    return group.orderItems.reduce((sum, item) => sum + item.price, 0);
  };

  // 格式化金额
  const formatMoney = (amount: number) => {
    return `¥${amount.toFixed(2)}`;
  };

  // 格式化日期
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "未填写";
    return new Date(dateStr).toLocaleDateString("zh-CN");
  };

  // 处理核查状态切换
  const toggleVerified = async (groupId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/orders/${groupId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVerified: !currentStatus }),
      });
      if (res.ok) {
        loadOrderGroups();
      }
    } catch (error) {
      console.error("更新核查状态失败:", error);
    }
  };

  // 处理报销状态切换
  const toggleReimbursed = async (groupId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/orders/${groupId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isReimbursed: !currentStatus }),
      });
      if (res.ok) {
        loadOrderGroups();
      }
    } catch (error) {
      console.error("更新报销状态失败:", error);
    }
  };

  // 删除订单组
  const deleteOrderGroup = async (groupId: string) => {
    if (!confirm("确定要删除这个供应商订单组吗？")) return;
    try {
      const res = await fetch(`/api/orders/${groupId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        loadOrderGroups();
      }
    } catch (error) {
      console.error("删除订单失败:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <div className="bg-white border-b px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">试剂订购管理</h1>
            <p className="text-sm text-gray-500 mt-1">
              当前用户：{(session.user as any)?.username} ({userRole === "ADMIN" ? "管理员" : "学生"})
            </p>
          </div>
          <div className="flex items-center gap-4">
            {userRole === "ADMIN" && (
              <a
                href="/admin/users"
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                成员管理
              </a>
            )}
            <a
              href="/api/auth/signout"
              className="text-sm text-red-600 hover:text-red-500"
              onClick={(e) => {
                e.preventDefault();
                signOut({ callbackUrl: "/login" });
              }}
            >
              退出
            </a>
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* 过滤器 */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            {/* 月份选择器 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                选择月份
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="border rounded-md px-3 py-2 min-w-[150px]"
              >
                {months.length === 0 && (
                  <option value={getCurrentMonth()}>无历史数据</option>
                )}
                {months.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
            </div>

            {/* 用户选择器（仅管理员） */}
            {userRole === "ADMIN" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  查看学生
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="border rounded-md px-3 py-2 min-w-[150px]"
                >
                  <option value="">所有学生</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.username}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 新增供应商按钮 */}
            <div className="ml-auto">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                &nbsp;
              </label>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                + 新增供应商
              </button>
            </div>
          </div>
        </div>

        {/* 供应商卡片列表 */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">加载中...</div>
        ) : orderGroups.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            暂无订单数据，点击「新增供应商」开始录入
          </div>
        ) : (
          <div className="grid gap-6">
            {orderGroups.map((group) => (
              <div
                key={group.id}
                className="bg-white rounded-lg shadow border overflow-hidden"
              >
                {/* 卡片头部 */}
                <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-lg">{group.supplierName}</h3>
                    <p className="text-sm text-gray-500">
                      创建时间：{formatDate(group.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    {/* 状态徽章 */}
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        group.isVerified
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {group.isVerified ? "已核查" : "待核查"}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        group.isReimbursed
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {group.isReimbursed ? "已报销" : "未报销"}
                      </span>
                    </div>
                    {/* 管理员操作按钮 */}
                    {userRole === "ADMIN" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleVerified(group.id, group.isVerified)}
                          className={`px-3 py-1 rounded text-sm ${
                            group.isVerified
                              ? "bg-gray-200 hover:bg-gray-300"
                              : "bg-green-600 text-white hover:bg-green-700"
                          }`}
                        >
                          确认核查
                        </button>
                        <button
                          onClick={() => toggleReimbursed(group.id, group.isReimbursed)}
                          className={`px-3 py-1 rounded text-sm ${
                            group.isReimbursed
                              ? "bg-gray-200 hover:bg-gray-300"
                              : "bg-blue-600 text-white hover:bg-blue-700"
                          }`}
                        >
                          确认报销
                        </button>
                      </div>
                    )}
                    {/* 删除按钮 */}
                    <button
                      onClick={() => deleteOrderGroup(group.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      删除
                    </button>
                  </div>
                </div>

                {/* 耗材明细表格 */}
                <div className="p-4">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-gray-600 border-b">
                        <th className="pb-2 font-medium">试剂名称</th>
                        <th className="pb-2 font-medium">类型</th>
                        <th className="pb-2 font-medium">订购日期</th>
                        <th className="pb-2 font-medium text-right">价格</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.orderItems.map((item) => (
                        <tr key={item.id} className="border-b last:border-0">
                          <td className="py-2 text-gray-900">{item.reagentName}</td>
                          <td className="py-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              item.type === "PUBLIC_REAGENT"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-orange-100 text-orange-800"
                            }`}>
                              {item.type === "PUBLIC_REAGENT" ? "公共试剂" : "个人试剂"}
                            </span>
                          </td>
                          <td className="py-2 text-sm text-gray-600">
                            {formatDate(item.orderDate)}
                          </td>
                          <td className="py-2 text-right font-medium text-gray-900">
                            ¥{item.price.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50">
                        <td colSpan={3} className="py-2 font-medium text-right pr-4">
                          合计：
                        </td>
                        <td className="py-2 text-right font-bold text-lg">
                          {formatMoney(calculateTotal(group))}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* 发票信息 */}
                <div className="bg-gray-50 px-4 py-3 border-t">
                  <div className="flex flex-wrap gap-6 text-sm">
                    <div>
                      <span className="text-gray-500">发票号：</span>
                      <span className="font-medium">
                        {group.invoiceNumber || "未填写"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">开票日期：</span>
                      <span className="font-medium">
                        {formatDate(group.invoiceDate)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 新增供应商模态框 */}
      {showAddModal && (
        <AddOrderModal
          month={selectedMonth}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadOrderGroups();
          }}
        />
      )}
    </div>
  );
}

// 新增供应商模态框组件
function AddOrderModal({
  month,
  onClose,
  onSuccess,
}: {
  month: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [supplierName, setSupplierName] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [items, setItems] = useState<Array<{
    reagentName: string;
    type: "PUBLIC_REAGENT" | "PERSONAL_REAGENT";
    price: string;
    orderDate: string;
  }>>([]);

  const addItem = () => {
    setItems([
      ...items,
      { reagentName: "", type: "PUBLIC_REAGENT", price: "", orderDate: new Date().toISOString().split("T")[0] },
    ]);
  };

  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim()) {
      alert("请填写供应商名称");
      return;
    }
    if (items.length === 0) {
      alert("请至少添加一项耗材");
      return;
    }

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month,
          supplierName: supplierName.trim(),
          invoiceNumber: invoiceNumber.trim() || null,
          invoiceDate: invoiceDate || null,
          orderItems: items,
        }),
      });
      if (res.ok) {
        onSuccess();
      } else {
        const data = await res.json();
        alert(data.error || "创建失败");
      }
    } catch (error) {
      console.error("创建订单失败:", error);
      alert("创建失败，请稍后重试");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">新增供应商订单</h2>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* 基本信息 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    月份 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={month}
                    disabled
                    className="w-full border rounded-md px-3 py-2 bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    供应商名称 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    placeholder="例如：诺唯赞、生工、Thermo"
                    className="w-full border rounded-md px-3 py-2"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    发票号
                  </label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="w-full border rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    开票日期
                  </label>
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="w-full border rounded-md px-3 py-2"
                  />
                </div>
              </div>

              {/* 耗材明细 */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    耗材明细
                  </label>
                  <button
                    type="button"
                    onClick={addItem}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    + 添加耗材
                  </button>
                </div>
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div key={index} className="border rounded-md p-3 bg-gray-50">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-600">
                          耗材 #{index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          删除
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <input
                            type="text"
                            value={item.reagentName}
                            onChange={(e) => updateItem(index, "reagentName", e.target.value)}
                            placeholder="试剂名称/规格"
                            className="w-full border rounded-md px-3 py-2"
                            required
                          />
                        </div>
                        <div>
                          <select
                            value={item.type}
                            onChange={(e) => updateItem(index, "type", e.target.value as any)}
                            className="w-full border rounded-md px-3 py-2"
                          >
                            <option value="PUBLIC_REAGENT">公共试剂</option>
                            <option value="PERSONAL_REAGENT">个人试剂</option>
                          </select>
                        </div>
                        <div>
                          <input
                            type="number"
                            step="0.01"
                            value={item.price}
                            onChange={(e) => updateItem(index, "price", e.target.value)}
                            placeholder="价格"
                            className="w-full border rounded-md px-3 py-2"
                            required
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="date"
                            value={item.orderDate}
                            onChange={(e) => updateItem(index, "orderDate", e.target.value)}
                            className="w-full border rounded-md px-3 py-2"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border rounded-md hover:bg-gray-50"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                创建订单
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}