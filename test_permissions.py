#!/usr/bin/env python3
import requests
import json

BASE_URL = "http://localhost:3001"

def login(username, password):
    res = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"username": username, "password": password}
    )
    data = res.json()
    if data["code"] == 0:
        return data["data"]["token"]
    return None

def test_api(token, path, method="GET", json_data=None):
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    if method == "GET":
        res = requests.get(f"{BASE_URL}{path}", headers=headers)
    elif method == "POST":
        res = requests.post(f"{BASE_URL}{path}", headers=headers, json=json_data)
    elif method == "DELETE":
        res = requests.delete(f"{BASE_URL}{path}", headers=headers)
    return res.json()

def run_tests():
    print("=" * 60)
    print("🔐 全链路权限管控与流程闭环测试")
    print("=" * 60)
    
    # 1. 测试超级管理员
    print("\n1️⃣  超级管理员 (admin/admin123)")
    print("-" * 40)
    admin_token = login("admin", "admin123")
    print(f"登录成功: {admin_token is not None}")
    
    # 测试规则引擎权限
    res = test_api(admin_token, "/api/rules")
    print(f"规则引擎访问: {res['code'] == 0}")
    
    # 测试删除规则权限
    res = test_api(admin_token, "/api/rules/1", method="DELETE")
    print(f"删除规则权限: {res['code'] == 0 or res['code'] == 404}")
    
    # 2. 测试区域经理
    print("\n2️⃣  区域经理 (region/reg123)")
    print("-" * 40)
    region_token = login("region", "reg123")
    print(f"登录成功: {region_token is not None}")
    
    # 测试订单区域过滤
    res = test_api(region_token, "/api/orders?page=1&pageSize=10")
    if res["code"] == 0:
        orders = res["data"]["list"]
        regions = set(o["region"] for o in orders)
        print(f"订单区域过滤: {regions == {'华东'}} (实际: {regions})")
    
    # 测试无权限访问规则引擎
    res = test_api(region_token, "/api/rules")
    print(f"规则引擎访问被拦截: {res['code'] == 403} (实际: {res['code']})")
    
    # 3. 测试运营
    print("\n3️⃣  运营 (operator/oper123)")
    print("-" * 40)
    oper_token = login("operator", "oper123")
    print(f"登录成功: {oper_token is not None}")
    
    # 测试采购单访问
    res = test_api(oper_token, "/api/inventory/purchase")
    print(f"采购单访问: {res['code'] == 0}")
    
    # 4. 测试财务
    print("\n4️⃣  财务 (finance/fin123)")
    print("-" * 40)
    finance_token = login("finance", "fin123")
    print(f"登录成功: {finance_token is not None}")
    
    # 测试财务审批访问
    res = test_api(finance_token, "/api/inventory/purchase?status=finance_pending")
    print(f"财务待审批访问: {res['code'] == 0}")
    
    # 测试运营无权限审批财务单据
    res = test_api(oper_token, "/api/inventory/purchase/1/approve", method="POST")
    print(f"运营无财务审批权被拦截: {res['code'] == 403} (实际: {res['code']})")
    
    # 5. 测试仓储
    print("\n5️⃣  仓储 (warehouse/ware123)")
    print("-" * 40)
    warehouse_token = login("warehouse", "ware123")
    print(f"登录成功: {warehouse_token is not None}")
    
    # 测试仓储确认访问
    res = test_api(warehouse_token, "/api/inventory/purchase?status=warehouse_pending")
    print(f"仓储待确认访问: {res['code'] == 0}")
    
    # 6. 测试数据采集
    print("\n6️⃣  数据采集功能测试")
    print("-" * 40)
    res = test_api(admin_token, "/api/collection/tasks")
    print(f"采集任务列表: {res['code'] == 0}")
    if res["code"] == 0:
        print(f"任务数量: {len(res['data'])}")
    
    # 测试区域经理无数据采集权限
    res = test_api(region_token, "/api/collection/tasks")
    print(f"区域经理无采集权限被拦截: {res['code'] == 403} (实际: {res['code']})")
    
    # 7. 测试消息中心
    print("\n7️⃣  消息中心测试")
    print("-" * 40)
    res = test_api(admin_token, "/api/notifications/inbox")
    print(f"站内信列表: {res['code'] == 0}")
    if res["code"] == 0:
        print(f"消息数量: {len(res['data']['list'])}")
    
    res = test_api(admin_token, "/api/notifications/sms")
    print(f"短信记录: {res['code'] == 0}")
    
    # 8. 测试未授权访问
    print("\n8️⃣  未授权访问测试")
    print("-" * 40)
    res = test_api(None, "/api/orders")
    print(f"无token访问被拦截: {res['code'] == 401}")
    
    # 9. 测试采购单版本号
    print("\n9️⃣  采购单版本号测试")
    print("-" * 40)
    res = test_api(admin_token, "/api/inventory/purchase?status=finance_rejected&pageSize=5")
    if res["code"] == 0:
        pos = res["data"]["list"]
        versions = [po.get("version", 0) for po in pos]
        rejection_counts = [po.get("rejectionCount", 0) for po in pos]
        print(f"驳回采购单版本号: {versions}")
        print(f"驳回次数: {rejection_counts}")
        has_v2 = any(v > 1 for v in versions)
        print(f"存在版本号>1的采购单: {has_v2}")
    
    print("\n" + "=" * 60)
    print("✅ 测试完成")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
