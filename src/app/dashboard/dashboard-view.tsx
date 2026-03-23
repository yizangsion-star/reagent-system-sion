"use client";

import { useState, useEffect } from "react";
import { Session } from "next-auth";
import { Navbar } from "@/components/navbar";

// 按供应商分组的数据结构
type SupplierGroups = Map<string, OrderGroup[]>;

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
  
  // 弹窗状态
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<OrderGroup | null>(null);

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
    if (!confirm("确定要删除这个供应商订单组吗？此操作会删除该供应商的所有购买记录。")) return;
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

  // 按供应商分组数据（用于管理员查看所有学生时）
  const groupBySupplier = (groups: OrderGroup[]): SupplierGroups => {
    const map: SupplierGroups = new Map();
    groups.forEach(group => {
      const existing = map.get(group.supplierName) || [];
      existing.push(group);
      map.set(group.supplierName, existing);
    });
    return map;
  };

  // 计算供应商总金额
  const calculateSupplierTotal = (groups: OrderGroup[]) => {
    return groups.reduce((sum, group) => sum + calculateTotal(group), 0);
  };

  // 打开添加明细弹窗
  const openAddItemModal = (group: OrderGroup) => {
    setSelectedGroup(group);
    setShowAddItemModal(true);
  };

  // 打开填写发票弹窗
  const openInvoiceModal = (group: OrderGroup) => {
    setSelectedGroup(group);
    setShowInvoiceModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 全局导航栏 */}
      <Navbar
        username={(session.user as any)?.username}
        userRole={userRole}
      />

      {/* 主内容区 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 过滤器 */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-end">
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
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                + 新增供应商/添加明细
              </button>
            </div>
          </div>
        </div>

        {/* 供应商卡片列表 */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">加载中...</div>
        ) : orderGroups.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-white rounded-lg shadow">
            <svg className="mx-auto h-12 w-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-lg font-medium text-gray-900 mb-1">暂无订单数据</p>
            <p className="text-gray-500">点击「新增供应商」开始录入试剂购买记录</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {/* 管理员查看所有学生：按公司分组显示 */}
            {userRole === "ADMIN" && !selectedUserId ? (
              <AdminGroupedView
                supplierGroups={groupBySupplier(orderGroups)}
                onEditInvoice={openInvoiceModal}
                onToggleVerified={toggleVerified}
                onToggleReimbursed={toggleReimbursed}
                onDelete={deleteOrderGroup}
                formatDate={formatDate}
                formatMoney={formatMoney}
                calculateTotal={calculateTotal}
                calculateSupplierTotal={calculateSupplierTotal}
              />
            ) : (
              /* 学生视角或管理员查看特定学生：平铺显示 */
              orderGroups.map((group) => (
                <SupplierCard
                  key={group.id}
                  group={group}
                  userRole={userRole}
                  showStudentName={!!selectedUserId && userRole === "ADMIN"}
                  onAddItem={() => openAddItemModal(group)}
                  onEditInvoice={() => openInvoiceModal(group)}
                  onToggleVerified={() => toggleVerified(group.id, group.isVerified)}
                  onToggleReimbursed={() => toggleReimbursed(group.id, group.isReimbursed)}
                  onDelete={() => deleteOrderGroup(group.id)}
                  formatDate={formatDate}
                  formatMoney={formatMoney}
                  calculateTotal={calculateTotal}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* 新增供应商/明细弹窗 */}
      {showAddModal && (
        <AddSupplierModal
          month={selectedMonth}
          existingSuppliers={orderGroups.map(g => g.supplierName)}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadOrderGroups();
          }}
        />
      )}

      {/* 添加明细弹窗 */}
      {showAddItemModal && selectedGroup && (
        <AddItemModal
          group={selectedGroup}
          onClose={() => {
            setShowAddItemModal(false);
            setSelectedGroup(null);
          }}
          onSuccess={() => {
            setShowAddItemModal(false);
            setSelectedGroup(null);
            loadOrderGroups();
          }}
        />
      )}

      {/* 填写发票弹窗 */}
      {showInvoiceModal && selectedGroup && (
        <InvoiceModal
          group={selectedGroup}
          totalAmount={calculateTotal(selectedGroup)}
          onClose={() => {
            setShowInvoiceModal(false);
            setSelectedGroup(null);
          }}
          onSuccess={() => {
            setShowInvoiceModal(false);
            setSelectedGroup(null);
            loadOrderGroups();
          }}
        />
      )}
    </div>
  );
}

// 供应商卡片组件
interface SupplierCardProps {
  group: OrderGroup;
  userRole: string;
  showStudentName?: boolean;
  onAddItem?: () => void;
  onEditInvoice: () => void;
  onToggleVerified: () => void;
  onToggleReimbursed: () => void;
  onDelete: () => void;
  formatDate: (date: string | null) => string;
  formatMoney: (amount: number) => string;
  calculateTotal: (group: OrderGroup) => number;
}

function SupplierCard({
  group,
  userRole,
  showStudentName = false,
  onAddItem,
  onEditInvoice,
  onToggleVerified,
  onToggleReimbursed,
  onDelete,
  formatDate,
  formatMoney,
  calculateTotal,
}: SupplierCardProps) {
  const total = calculateTotal(group);
  const hasInvoice = group.invoiceNumber || group.invoiceDate;

  return (
    <div className="bg-white rounded-lg shadow border overflow-hidden">
      {/* 卡片头部 */}
      <div className="bg-gray-50 px-4 py-3 border-b">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3">
              {showStudentName && group.user && (
                <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
                  {group.user.username}
                </span>
              )}
              <h3 className="font-semibold text-lg text-gray-900">{group.supplierName}</h3>
              {/* 状态徽章 */}
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  group.isVerified
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}>
                  {group.isVerified ? "已核查" : "待核查"}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  group.isReimbursed
                    ? "bg-blue-100 text-blue-800"
                    : "bg-gray-100 text-gray-800"
                }`}>
                  {group.isReimbursed ? "已报销" : "未报销"}
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {group.orderItems.length} 项试剂 · 最后更新：{formatDate(group.updatedAt)}
            </p>
          </div>
          
          {/* 操作按钮 */}
          <div className="flex items-center gap-2">
            {/* 添加明细按钮 */}
            <button
              onClick={onAddItem}
              className="px-3 py-1.5 text-sm bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 transition-colors"
            >
              + 添加试剂
            </button>
            
            {/* 填写发票按钮 */}
            <button
              onClick={onEditInvoice}
              className={`px-3 py-1.5 text-sm rounded transition-colors ${
                hasInvoice
                  ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  : "bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200"
              }`}
            >
              {hasInvoice ? "修改发票" : "填写发票"}
            </button>

            {/* 管理员操作 */}
            {userRole === "ADMIN" && (
              <>
                <button
                  onClick={onToggleVerified}
                  className={`px-3 py-1.5 text-sm rounded transition-colors ${
                    group.isVerified
                      ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      : "bg-green-600 text-white hover:bg-green-700"
                  }`}
                >
                  {group.isVerified ? "取消核查" : "确认核查"}
                </button>
                <button
                  onClick={onToggleReimbursed}
                  className={`px-3 py-1.5 text-sm rounded transition-colors ${
                    group.isReimbursed
                      ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {group.isReimbursed ? "取消报销" : "确认报销"}
                </button>
              </>
            )}
            
            {/* 删除按钮 */}
            <button
              onClick={onDelete}
              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
              title="删除整个供应商订单组"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 耗材明细表格 */}
      <div className="p-4">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-gray-600 border-b">
              <th className="pb-2 font-medium">订购日期</th>
              <th className="pb-2 font-medium">试剂名称</th>
              <th className="pb-2 font-medium">类型</th>
              <th className="pb-2 font-medium text-right">价格</th>
            </tr>
          </thead>
          <tbody>
            {group.orderItems.map((item) => (
              <tr key={item.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="py-2 text-sm text-gray-600">
                  {formatDate(item.orderDate)}
                </td>
                <td className="py-2 text-gray-900">{item.reagentName}</td>
                <td className="py-2">
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    item.type === "PUBLIC_REAGENT"
                      ? "bg-purple-100 text-purple-800"
                      : "bg-orange-100 text-orange-800"
                  }`}>
                    {item.type === "PUBLIC_REAGENT" ? "公共试剂" : "个人试剂"}
                  </span>
                </td>
                <td className="py-2 text-right font-medium text-gray-900">
                  {formatMoney(item.price)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50">
              <td colSpan={3} className="py-3 font-medium text-right pr-4 text-gray-900">
                合计金额：
              </td>
              <td className="py-3 text-right font-bold text-lg text-gray-900">
                {formatMoney(total)}
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
            <span className={`font-medium ${group.invoiceNumber ? "text-gray-900" : "text-amber-600"}`}>
              {group.invoiceNumber || "待填写"}
            </span>
          </div>
          <div>
            <span className="text-gray-500">开票日期：</span>
            <span className={`font-medium ${group.invoiceDate ? "text-gray-900" : "text-amber-600"}`}>
              {formatDate(group.invoiceDate)}
            </span>
          </div>
          {!hasInvoice && (
            <div className="text-amber-600 text-xs flex items-center">
              <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              请月底收到发票后及时填写，方便核对金额
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 新增供应商/明细弹窗
interface AddSupplierModalProps {
  month: string;
  existingSuppliers: string[];
  onClose: () => void;
  onSuccess: () => void;
}

function AddSupplierModal({ month, existingSuppliers, onClose, onSuccess }: AddSupplierModalProps) {
  const [supplierName, setSupplierName] = useState("");
  const [isExisting, setIsExisting] = useState(false);
  const [loading, setLoading] = useState(false);

  // 表单数据
  const [reagentName, setReagentName] = useState("");
  const [type, setType] = useState<"PUBLIC_REAGENT" | "PERSONAL_REAGENT">("PUBLIC_REAGENT");
  const [price, setPrice] = useState("");
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split("T")[0]);

  // 检查供应商是否已存在
  useEffect(() => {
    const exists = existingSuppliers.some(
      s => s.toLowerCase() === supplierName.trim().toLowerCase()
    );
    setIsExisting(exists);
  }, [supplierName, existingSuppliers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim() || !reagentName.trim() || !price) {
      alert("请填写所有必填字段");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month,
          supplierName: supplierName.trim(),
          orderItems: [{
            reagentName: reagentName.trim(),
            type,
            price: parseFloat(price),
            orderDate,
          }],
        }),
      });

      if (res.ok) {
        onSuccess();
      } else {
        const data = await res.json();
        alert(data.error || "添加失败");
      }
    } catch (error) {
      console.error("添加失败:", error);
      alert("添加失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-lg w-full">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">
            {isExisting ? "添加到现有供应商" : "新增供应商"}
          </h2>
          
          {isExisting && (
            <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded text-sm">
              该供应商本月已有订单，将自动添加到现有卡片中
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                供应商名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="例如：生工、诺唯赞、Thermo"
                className="w-full border rounded-md px-3 py-2"
                required
                list="supplier-suggestions"
              />
              <datalist id="supplier-suggestions">
                {existingSuppliers.map(s => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  试剂名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={reagentName}
                  onChange={(e) => setReagentName(e.target.value)}
                  placeholder="例如：Mfn3抗体"
                  className="w-full border rounded-md px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  类型
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full border rounded-md px-3 py-2"
                >
                  <option value="PUBLIC_REAGENT">公共试剂</option>
                  <option value="PERSONAL_REAGENT">个人试剂</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  价格 (¥) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full border rounded-md px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  订购日期
                </label>
                <input
                  type="date"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border rounded-md hover:bg-gray-50"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "保存中..." : isExisting ? "添加到此供应商" : "创建并添加"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// 添加明细弹窗
interface AddItemModalProps {
  group: OrderGroup;
  onClose: () => void;
  onSuccess: () => void;
}

function AddItemModal({ group, onClose, onSuccess }: AddItemModalProps) {
  const [reagentName, setReagentName] = useState("");
  const [type, setType] = useState<"PUBLIC_REAGENT" | "PERSONAL_REAGENT">("PUBLIC_REAGENT");
  const [price, setPrice] = useState("");
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reagentName.trim() || !price) {
      alert("请填写试剂名称和价格");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${group.id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reagentName: reagentName.trim(),
          type,
          price: parseFloat(price),
          orderDate,
        }),
      });

      if (res.ok) {
        onSuccess();
      } else {
        const data = await res.json();
        alert(data.error || "添加失败");
      }
    } catch (error) {
      console.error("添加失败:", error);
      alert("添加失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-1">添加试剂明细</h2>
          <p className="text-sm text-gray-500 mb-4">供应商：{group.supplierName}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                试剂名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={reagentName}
                onChange={(e) => setReagentName(e.target.value)}
                placeholder="例如：Mfn3抗体"
                className="w-full border rounded-md px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                类型
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full border rounded-md px-3 py-2"
              >
                <option value="PUBLIC_REAGENT">公共试剂</option>
                <option value="PERSONAL_REAGENT">个人试剂</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  价格 (¥) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full border rounded-md px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  订购日期
                </label>
                <input
                  type="date"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border rounded-md hover:bg-gray-50"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "添加中..." : "添加"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// 填写发票弹窗
interface InvoiceModalProps {
  group: OrderGroup;
  totalAmount: number;
  onClose: () => void;
  onSuccess: () => void;
}

function InvoiceModal({ group, totalAmount, onClose, onSuccess }: InvoiceModalProps) {
  const [invoiceNumber, setInvoiceNumber] = useState(group.invoiceNumber || "");
  const [invoiceDate, setInvoiceDate] = useState(
    group.invoiceDate ? group.invoiceDate.split("T")[0] : ""
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${group.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceNumber: invoiceNumber || null,
          invoiceDate: invoiceDate || null,
        }),
      });

      if (res.ok) {
        onSuccess();
      } else {
        const data = await res.json();
        alert(data.error || "保存失败");
      }
    } catch (error) {
      console.error("保存失败:", error);
      alert("保存失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-1">填写发票信息</h2>
          <p className="text-sm text-gray-500 mb-4">供应商：{group.supplierName}</p>

          {/* 金额核对提示 */}
          <div className="mb-4 p-3 bg-blue-50 rounded text-sm">
            <div className="flex justify-between mb-1">
              <span className="text-gray-600">订单总金额：</span>
              <span className="font-bold text-blue-900">¥{totalAmount.toFixed(2)}</span>
            </div>
            <p className="text-blue-700 text-xs mt-1">
              请核对发票金额是否与订单金额一致
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                发票号
              </label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="例如：12345678"
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

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border rounded-md hover:bg-gray-50"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "保存中..." : "保存"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}


// 管理员分组视图组件（公司 -> 学生 -> 订单明细）
interface AdminGroupedViewProps {
  supplierGroups: SupplierGroups;
  onEditInvoice: (group: OrderGroup) => void;
  onToggleVerified: (groupId: string, currentStatus: boolean) => void;
  onToggleReimbursed: (groupId: string, currentStatus: boolean) => void;
  onDelete: (groupId: string) => void;
  formatDate: (date: string | null) => string;
  formatMoney: (amount: number) => string;
  calculateTotal: (group: OrderGroup) => number;
  calculateSupplierTotal: (groups: OrderGroup[]) => number;
}

function AdminGroupedView({
  supplierGroups,
  onEditInvoice,
  onToggleVerified,
  onToggleReimbursed,
  onDelete,
  formatDate,
  formatMoney,
  calculateTotal,
  calculateSupplierTotal,
}: AdminGroupedViewProps) {
  const [expandedSuppliers, setExpandedSuppliers] = useState<Set<string>>(new Set());

  const toggleExpand = (supplierName: string) => {
    const newExpanded = new Set(expandedSuppliers);
    if (newExpanded.has(supplierName)) {
      newExpanded.delete(supplierName);
    } else {
      newExpanded.add(supplierName);
    }
    setExpandedSuppliers(newExpanded);
  };

  // 默认展开所有
  useEffect(() => {
    setExpandedSuppliers(new Set(supplierGroups.keys()));
  }, [supplierGroups]);

  const sortedSuppliers = Array.from(supplierGroups.entries()).sort(
    ([nameA], [nameB]) => nameA.localeCompare(nameB, "zh-CN")
  );

  return (
    <div className="space-y-4">
      {sortedSuppliers.map(([supplierName, groups]) => {
        const supplierTotal = calculateSupplierTotal(groups);
        const isExpanded = expandedSuppliers.has(supplierName);
        const allVerified = groups.every(g => g.isVerified);
        const allReimbursed = groups.every(g => g.isReimbursed);

        return (
          <div key={supplierName} className="bg-white rounded-lg shadow border overflow-hidden">
            {/* 公司维度头部 */}
            <div
              className="bg-gradient-to-r from-indigo-50 to-blue-50 px-4 py-4 cursor-pointer hover:from-indigo-100 hover:to-blue-100 transition-colors"
              onClick={() => toggleExpand(supplierName)}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  {/* 展开/折叠图标 */}
                  <svg
                    className={`h-5 w-5 text-indigo-600 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  
                  {/* 公司名称 */}
                  <div>
                    <h3 className="text-xl font-bold text-indigo-900">{supplierName}</h3>
                    <p className="text-sm text-indigo-600 mt-1">
                      {groups.length} 位学生 · {groups.reduce((sum, g) => sum + g.orderItems.length, 0)} 项试剂
                    </p>
                  </div>

                  {/* 整体状态徽章 */}
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      allVerified
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {allVerified ? "全部已核查" : "有待核查"}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      allReimbursed
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {allReimbursed ? "全部已报销" : "有待报销"}
                    </span>
                  </div>
                </div>

                {/* 公司总金额 */}
                <div className="text-right">
                  <p className="text-sm text-gray-600">本月合计</p>
                  <p className="text-2xl font-bold text-indigo-900">{formatMoney(supplierTotal)}</p>
                </div>
              </div>
            </div>

            {/* 学生维度列表 */}
            {isExpanded && (
              <div className="border-t">
                {groups.map((group, index) => (
                  <div
                    key={group.id}
                    className={`p-4 ${index !== groups.length - 1 ? "border-b" : ""} hover:bg-gray-50`}
                  >
                    {/* 学生区块头部 */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        {/* 学生姓名 - 极其醒目的显示 */}
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                            {group.user?.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-lg font-bold text-gray-900">{group.user?.username}</p>
                            <p className="text-sm text-gray-500">{group.orderItems.length} 项试剂</p>
                          </div>
                        </div>

                        {/* 个人状态徽章 */}
                        <div className="flex gap-1 ml-4">
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            group.isVerified
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}>
                            {group.isVerified ? "已核查" : "待核查"}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            group.isReimbursed
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-700"
                          }`}>
                            {group.isReimbursed ? "已报销" : "未报销"}
                          </span>
                        </div>
                      </div>

                      {/* 个人操作按钮 */}
                      <div className="flex items-center gap-2">
                        {/* 填写发票按钮 */}
                        <button
                          onClick={() => onEditInvoice(group)}
                          className={`px-3 py-1.5 text-sm rounded transition-colors ${
                            group.invoiceNumber
                              ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                              : "bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200"
                          }`}
                        >
                          {group.invoiceNumber ? "修改发票" : "填写发票"}
                        </button>

                        {/* 确认核查按钮 */}
                        <button
                          onClick={() => onToggleVerified(group.id, group.isVerified)}
                          className={`px-3 py-1.5 text-sm rounded transition-colors ${
                            group.isVerified
                              ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                              : "bg-green-600 text-white hover:bg-green-700"
                          }`}
                        >
                          {group.isVerified ? "取消核查" : "确认核查"}
                        </button>

                        {/* 确认报销按钮 */}
                        <button
                          onClick={() => onToggleReimbursed(group.id, group.isReimbursed)}
                          className={`px-3 py-1.5 text-sm rounded transition-colors ${
                            group.isReimbursed
                              ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                              : "bg-blue-600 text-white hover:bg-blue-700"
                          }`}
                        >
                          {group.isReimbursed ? "取消报销" : "确认报销"}
                        </button>

                        {/* 删除按钮 */}
                        <button
                          onClick={() => onDelete(group.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="删除该学生的订单"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* 试剂明细表格 */}
                    <div className="bg-white rounded border overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-3 py-2 text-left text-gray-600 font-medium">订购日期</th>
                            <th className="px-3 py-2 text-left text-gray-600 font-medium">试剂名称</th>
                            <th className="px-3 py-2 text-left text-gray-600 font-medium">类型</th>
                            <th className="px-3 py-2 text-right text-gray-600 font-medium">价格</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.orderItems.map((item) => (
                            <tr key={item.id} className="border-t">
                              <td className="px-3 py-2 text-gray-600">{formatDate(item.orderDate)}</td>
                              <td className="px-3 py-2 text-gray-900">{item.reagentName}</td>
                              <td className="px-3 py-2">
                                <span className={`px-2 py-0.5 rounded text-xs ${
                                  item.type === "PUBLIC_REAGENT"
                                    ? "bg-purple-100 text-purple-800"
                                    : "bg-orange-100 text-orange-800"
                                }`}>
                                  {item.type === "PUBLIC_REAGENT" ? "公共" : "个人"}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-right font-medium text-gray-900">
                                {formatMoney(item.price)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-50">
                          <tr>
                            <td colSpan={3} className="px-3 py-2 text-right text-gray-600">
                              小计：
                            </td>
                            <td className="px-3 py-2 text-right font-bold text-gray-900">
                              {formatMoney(calculateTotal(group))}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* 发票信息 */}
                    <div className="mt-2 flex gap-4 text-sm">
                      <span className="text-gray-500">
                        发票号：
                        <span className={group.invoiceNumber ? "text-gray-900" : "text-amber-600"}>
                          {group.invoiceNumber || "待填写"}
                        </span>
                      </span>
                      <span className="text-gray-500">
                        开票日期：
                        <span className={group.invoiceDate ? "text-gray-900" : "text-amber-600"}>
                          {formatDate(group.invoiceDate)}
                        </span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
