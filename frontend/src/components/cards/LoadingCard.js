import React from "react";
import { Card, Col, Row, Skeleton } from "antd";

const LoadingCard = ({ count }) => {
    const cards = () => {
        let totalCards = [];

        for (let i = 0; i < count; i++) {
            totalCards.push(
                <Col xs={24} sm={12} xl={8} key={i}>
                    <Card><Skeleton active /></Card>
                </Col>
            );
        }

        return totalCards;
    };

    return <Row gutter={[16, 16]}>{cards()}</Row>;
};

export default LoadingCard;
