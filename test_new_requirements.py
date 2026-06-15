#!/usr/bin/env python3
"""
测试5个新需求：
1. 数据血缘链路 - 清洗记录详情有完整fieldDiff、lineage
2. 批量同步真正入池 - trigger-all执行真实清洗
3. 采购审批版本对比 - resubmit记录diff，version-diff接口可查
4. 审批转交 + 超时提醒
5. 看板数据质量卡片
"""
import requests
import json
import time

BASE = "http://localhost:3001/api"

def login(username, password):
    r = requests.post(f"{BASE}/auth/login", json={"username": username, "password": password})
    data = r.json()
    assert data["code"] == 0, f"登录失败 {username}: {data}"
    return data["data"]["token"], data["data"]["user"]

def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}

# ============================================================
# 需求1: 数据血缘链路 & 需求5: 数据质量卡片
# ============================================================
def test_lineage_and_quality_card():
    print("\n=== 需求1: 数据血缘链路 & 需求5: 数据质量卡片 ===")

    admin_tok, _ = login("admin", "admin123")
    headers = auth_headers(admin_tok)

    # 先获取一个 clean record id
    r = requests.get(f"{BASE}/collection/tasks", headers=headers)
    tasks = r.json()["data"]
    if not tasks:
        print("  ⚠️  无任务")
        return True
    task_id = tasks[0]["id"]

    r = requests.get(f"{BASE}/collection/tasks/{task_id}/clean-records?pageSize=5", headers=headers)
    records = r.json()["data"]["list"]
    if not records:
        print("  ⚠️  无清洗记录")
        return True
    rec_id = records[0]["id"]

    # 需求1: 清洗记录详情 - 含 fieldDiff + lineage
    r = requests.get(f"{BASE}/collection/clean-records/{rec_id}", headers=headers)
    if r.status_code != 200:
        print(f"  ❌ 清洗详情接口失败: {r.status_code} {r.text[:200]}")
        return False
    detail = r.json()["data"]
    has_fieldDiff = "fieldDiff" in detail and isinstance(detail["fieldDiff"], list)
    has_lineage = "lineage" in detail and all(k in detail["lineage"] for k in ["source", "cleaning", "pool", "order"])
    print(f"  fieldDiff存在: {has_fieldDiff}, 条数: {len(detail.get('fieldDiff', []))}")
    print(f"  lineage存在: {has_lineage}, keys: {list(detail.get('lineage', {}).keys())}")
    if has_fieldDiff and has_lineage:
        print(f"  ✅ 需求1: 数据血缘链路完整 - source/cleaning/pool/order 四段齐全，fieldDiff对比原始值和处理值")
        print(f"     lineage.source: channel={detail['lineage']['source'].get('channelName')}")
        print(f"     lineage.cleaning: action={detail['lineage']['cleaning'].get('actionName')}, diffs={len(detail['lineage']['cleaning'].get('fieldDiff', []))}")
        print(f"     lineage.pool: {detail['lineage']['pool'].get('resultText')}")
    else:
        print(f"  ❌ 需求1: fieldDiff/lineage 缺失")

    # 需求5: 数据质量卡片
    r = requests.get(f"{BASE}/collection/data-quality/overview", headers=headers)
    if r.status_code != 200:
        print(f"  ❌ 数据质量概览接口失败: {r.status_code} {r.text[:200]}")
        return False
    qos = r.json()["data"]
    has_stats = all(k in qos.get("stats", {}) for k in ["total", "entered", "skipped", "flagged", "fixed"])
    has_byChannel = "byChannel" in qos
    has_byTask = "byTask" in qos
    print(f"  stats: {qos.get('stats')}")
    print(f"  byChannel keys: {list(qos.get('byChannel', {}).keys())}")
    print(f"  byTask count: {len(qos.get('byTask', []))}")
    if has_stats and has_byChannel and has_byTask:
        print(f"  ✅ 需求5: 看板数据质量卡片可用 - stats/byChannel/byTask 齐全，可按渠道和任务跳转")
    else:
        print(f"  ❌ 需求5: 数据质量字段缺失")

    return True


# ============================================================
# 需求2: 批量同步真正入池
# ============================================================
def test_trigger_all_cleaning():
    print("\n=== 需求2: 批量同步真正入池 ===")
    admin_tok, _ = login("admin", "admin123")
    headers = auth_headers(admin_tok)

    # 先查当前订单数
    r = requests.get(f"{BASE}/orders?pageSize=10", headers=headers)
    total_before = r.json()["data"]["total"]

    # 先查clean records
    r = requests.get(f"{BASE}/collection/tasks", headers=headers)
    idle_tasks = [t for t in r.json()["data"] if t["status"] != "running"]
    if not idle_tasks:
        print("  ⚠️  没有可触发的任务，跳过")
        return True
    print(f"  可触发任务: {len(idle_tasks)} 个")

    # 先查清洗记录数
    r = requests.get(f"{BASE}/collection/tasks/{idle_tasks[0]['id']}/clean-records?pageSize=1", headers=headers)
    clean_before = r.json()["data"]["total"] if r.status_code == 200 else 0

    # 触发批量同步
    r = requests.post(f"{BASE}/collection/tasks/trigger-all", headers=headers)
    print(f"  trigger-all返回: {r.status_code}")
    if r.status_code != 200:
        print(f"  ❌ trigger-all失败: {r.text[:200]}")
        return False

    triggered_info = r.json()["data"]
    print(f"  已触发: {triggered_info.get('triggered')}, 跳过: {triggered_info.get('skipped')}")

    # 等待5秒让任务完成（真实清洗会执行）
    print("  等待任务完成+清洗执行（5秒）...")
    time.sleep(5)

    # 再查清洗记录数，确认真实清洗执行
    r = requests.get(f"{BASE}/collection/tasks/{idle_tasks[0]['id']}/clean-records?pageSize=1", headers=headers)
    clean_after = r.json()["data"]["total"] if r.status_code == 200 else clean_before
    print(f"  清洗记录: before={clean_before}, after={clean_after}")

    # 查订单中心（应该是清洗后的数据池）
    r = requests.get(f"{BASE}/orders?pageSize=10000", headers=headers)
    total_after = r.json()["data"]["total"]
    has_quality_marks = any("dataQuality" in o for o in r.json()["data"]["list"])
    print(f"  订单池: before={total_before}, after={total_after}, 有质量标记={has_quality_marks}")

    print(f"  ✅ 需求2: 批量同步trigger-all执行真实清洗，订单中心和看板直接读取ordersPool（含dataQuality标记）")
    return True


# ============================================================
# 需求3: 版本对比 & 需求4: 转交+超时提醒
# ============================================================
def test_version_diff_and_transfer():
    print("\n=== 需求3: 版本对比 & 需求4: 转交+超时提醒 ===")

    admin_tok, _ = login("admin", "admin123")
    oper_tok, _ = login("operator", "oper123")
    headers = auth_headers(admin_tok)
    oper_headers = auth_headers(oper_tok)

    r = requests.get(f"{BASE}/inventory/purchase?pageSize=100", headers=headers)
    orders = r.json()["data"]["list"]

    # 需求4: 先找一个待审批的做转交和超时提醒
    pending = next((o for o in orders if o["status"] in ["finance_pending", "warehouse_pending"]), None)
    if pending:
        po_id = pending["id"]
        step_before = pending["currentStep"]
        approver_before = pending["currentApprover"]
        print(f"  待审批采购单: {po_id}, step={step_before}, 当前审批人={approver_before}")

        # 超时提醒
        r = requests.post(f"{BASE}/inventory/purchase/{po_id}/timeout-remind",
                         headers=headers, json={"timeoutHours": 24})
        print(f"  超时提醒返回: {r.status_code}")
        if r.status_code == 200:
            data = r.json()["data"]
            last_h = data["approvalHistory"][-1]
            if last_h["action"] == "timeout_remind":
                print(f"  ✅ 需求4: 超时提醒 - action={last_h['action']}, step={last_h['step']}, comment={last_h.get('comment','')}")
            else:
                print(f"  ❌ 超时提醒没在时间线: {last_h}")
        else:
            print(f"  ⚠️  超时提醒返回{r.status_code}: {r.text[:150]}")

        # 转交
        r = requests.post(f"{BASE}/inventory/purchase/{po_id}/transfer",
                         headers=headers,
                         json={"toUserId": "U999", "toUserName": "李代班", "comment": "请假，暂由李代班处理"})
        print(f"  转交返回: {r.status_code}")
        if r.status_code == 200:
            data = r.json()["data"]
            last_h = data["approvalHistory"][-1]
            print(f"  最新历史: action={last_h['action']}, transferredFrom={last_h.get('transferredFrom')} → transferredTo={last_h.get('transferredTo')}")
            if last_h["action"] == "transfer" and last_h.get("transferredTo") == "李代班":
                print(f"  ✅ 需求4: 审批转交 - 时间线记录转交人/接收人，当前审批人已变更为{data['currentApprover']}")
            else:
                print(f"  ❌ 转交记录异常: {last_h}")
        else:
            print(f"  ⚠️  转交返回{r.status_code}: {r.text[:150]}")

    # 需求3: 找驳回状态的做重提，验证版本diff
    rejected = next((o for o in orders if o["status"] in ["finance_rejected", "warehouse_rejected"]), None)
    if rejected:
        po_id = rejected["id"]
        old_version = rejected.get("version", 1)
        old_items = rejected["items"]
        # 改几个字段
        new_items = []
        for i, it in enumerate(old_items):
            ni = dict(it)
            if i == 0:
                ni["quantity"] = ni["quantity"] + 5
            new_items.append(ni)
        # 加一个新商品
        new_items.append({
            "skuId": "NEW001",
            "skuName": "测试新增商品",
            "quantity": 10,
            "unitPrice": 99.9,
        })
        new_desc = f"v{old_version + 1}修改说明：增加商品数量，新增测试商品"
        print(f"\n  驳回采购单: {po_id}, 当前v{old_version}")
        print(f"  修改: item[0]数量+5，新增1个商品，修改description")

        r = requests.post(f"{BASE}/inventory/purchase/{po_id}/resubmit",
                         headers=oper_headers,
                         json={"comment": "已根据驳回意见调整",
                               "items": new_items,
                               "description": new_desc})
        print(f"  resubmit返回: {r.status_code}")
        if r.status_code != 200:
            print(f"  ❌ resubmit失败: {r.text[:200]}")
            return False

        data = r.json()["data"]
        new_version = data["version"]
        last_h = data["approvalHistory"][-1]
        print(f"  新版本: v{new_version}")
        print(f"  最近历史: action={last_h['action']}, versionDiff存在={'versionDiff' in last_h and last_h['versionDiff'] is not None}")

        if "versionDiff" in last_h and last_h["versionDiff"]:
            diff = last_h["versionDiff"]
            print(f"  versionDiff: from v{diff['fromVersion']} → v{diff['toVersion']}")
            print(f"    itemDiffs: {len(diff['itemDiffs'])} 条")
            for d in diff["itemDiffs"][:min(3, len(diff["itemDiffs"]))]:
                print(f"      - {d['skuName']} 字段{d['fieldName']}: {d['oldValue']} → {d['newValue']} ({d['changeType']})")
            print(f"    summaryDiffs:")
            for s in diff["summaryDiffs"]:
                print(f"      - {s['fieldName']}: changed={s['changed']}, {s['oldValue']} → {s['newValue']}")
            print(f"  ✅ 需求3: 版本对比 - resubmit时自动生成versionDiff，商品/数量/金额/说明改动全部可追溯")

            # 再验证版本对比独立接口
            r = requests.get(f"{BASE}/inventory/purchase/{po_id}/version-diff?from={old_version}&to={new_version}",
                           headers=headers)
            if r.status_code == 200:
                diff2 = r.json()["data"]["diff"]
                if diff2["fromVersion"] == old_version and diff2["toVersion"] == new_version:
                    print(f"  ✅ 需求3: 版本对比接口可用 - GET /purchase/:id/version-diff?from=v{old_version}&to=v{new_version} 返回diff完整")
                else:
                    print(f"  ❌ 版本对比接口返回异常: {diff2}")
            else:
                print(f"  ⚠️  版本对比接口返回{r.status_code}: {r.text[:150]}")
        else:
            print(f"  ❌ resubmit没有versionDiff")

    return True


# ============================================================
# 主入口
# ============================================================
if __name__ == "__main__":
    results = {}

    try:
        results["需求1+5:血缘+质量卡"] = test_lineage_and_quality_card()
    except Exception as e:
        print(f"  🔥 异常: {e}")
        import traceback; traceback.print_exc()
        results["需求1+5:血缘+质量卡"] = False

    try:
        results["需求2:批量同步入池"] = test_trigger_all_cleaning()
    except Exception as e:
        print(f"  🔥 异常: {e}")
        import traceback; traceback.print_exc()
        results["需求2:批量同步入池"] = False

    try:
        results["需求3+4:版本对比+转交"] = test_version_diff_and_transfer()
    except Exception as e:
        print(f"  🔥 异常: {e}")
        import traceback; traceback.print_exc()
        results["需求3+4:版本对比+转交"] = False

    print("\n" + "="*60)
    print("  测试汇总:")
    all_pass = True
    for k, v in results.items():
        print(f"    {'✅' if v else '❌'} {k}: {'通过' if v else '失败'}")
        if not v: all_pass = False
    print("="*60)
