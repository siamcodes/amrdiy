import React, { useEffect, useMemo, useState } from "react";
import { Badge, Empty, Skeleton, Tag, Tree } from "antd";
import {
    ApiOutlined, BulbOutlined, CameraOutlined, ControlOutlined,
    ExperimentOutlined, RobotOutlined, ShoppingOutlined, TagsOutlined,
    ThunderboltOutlined, ToolOutlined, WifiOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import { getCategories } from "../../functions/category";
import { getSubs } from "../../functions/sub";
import { getProductTypes } from "../../functions/productType";

const CategoryTree = ({ navigable = true, onSelect }) => {
    const [categories, setCategories] = useState([]);
    const [subs, setSubs] = useState([]);
    const [productTypes, setProductTypes] = useState([]);
    const [expandedKeys, setExpandedKeys] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([getCategories(), getSubs(), getProductTypes()])
            .then(([categoryResponse, subResponse, typeResponse]) => {
                setCategories(categoryResponse.data);
                setSubs(subResponse.data);
                setProductTypes(typeResponse.data);
                setExpandedKeys([]);
            })
            .finally(() => setLoading(false));
    }, []);

    const categoryIcon = (name = "") => {
        const value = name.toLowerCase();
        if (/iot|wifi|wireless|esp|อินเทอร์เน็ต|ไร้สาย/.test(value)) return <WifiOutlined />;
        if (/robot|หุ่นยนต์|motor|มอเตอร์/.test(value)) return <RobotOutlined />;
        if (/sensor|เซนเซอร์|วัด|ตรวจจับ/.test(value)) return <ExperimentOutlined />;
        if (/tool|เครื่องมือ|สว่าน|บัดกรี/.test(value)) return <ToolOutlined />;
        if (/power|battery|แบต|ไฟฟ้า|พลังงาน/.test(value)) return <ThunderboltOutlined />;
        if (/light|led|หลอด|แสง/.test(value)) return <BulbOutlined />;
        if (/camera|กล้อง|vision/.test(value)) return <CameraOutlined />;
        if (/board|arduino|micro|controller|บอร์ด|ควบคุม/.test(value)) return <ControlOutlined />;
        if (/module|โมดูล|อิเล็กทรอนิกส์/.test(value)) return <ApiOutlined />;
        return <ShoppingOutlined />;
    };

    const title = (item, type, childCount = 0) => {
        const content = (
            <span className={`category-tree-title level-${type}`}>
                <span className="category-tree-name">{item.name}</span>
                {type === "category" && childCount > 0 && (
                    <Badge count={childCount} color="#1677ff" overflowCount={99} />
                )}
                {type === "productType" && <Tag color="orange">สินค้า</Tag>}
            </span>
        );
        if (!navigable) return content;
        if (type === "category") return <Link to={`/category/${item.slug}`}>{content}</Link>;
        if (type === "sub") return <Link to={`/sub/${item.slug}`}>{content}</Link>;
        return content;
    };

    const treeData = useMemo(() => categories.map((category) => ({
        key: `category:${category._id}`,
        title: title(
            category,
            "category",
            subs.filter((sub) => (sub.parent?._id || sub.parent) === category._id).length
        ),
        icon: categoryIcon(category.name),
        entity: { ...category, type: "category" },
        children: subs
            .filter((sub) => (sub.parent?._id || sub.parent) === category._id)
            .map((sub) => ({
                key: `sub:${sub._id}`,
                title: title(sub, "sub"),
                icon: categoryIcon(sub.name),
                entity: { ...sub, type: "sub" },
                children: productTypes
                    .filter((type) => (type.parent?._id || type.parent) === sub._id)
                    .map((type) => ({
                        key: `productType:${type._id}`,
                        title: title(type, "productType"),
                        icon: <TagsOutlined />,
                        entity: { ...type, type: "productType" },
                        isLeaf: true,
                    })),
            })),
    })), [categories, navigable, productTypes, subs]);

    if (loading) return <Skeleton active paragraph={{ rows: 6 }} />;
    if (!treeData.length) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="ยังไม่มีหมวดสินค้า" />;

    return (
        <Tree
            className="product-category-tree"
            showIcon
            showLine
            blockNode
            treeData={treeData}
            expandedKeys={expandedKeys}
            autoExpandParent={false}
            onExpand={setExpandedKeys}
            onSelect={(_, info) => onSelect?.(info.node.entity)}
        />
    );
};

export default CategoryTree;
