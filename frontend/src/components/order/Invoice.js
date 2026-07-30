import React from "react";
import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";

// Register Font
Font.register({
    family: "Roboto",
    src:
      "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf"
  });

const Invoice = ({ order }) => (
    <Document>
        <Page style={styles.body}>
            <Text style={styles.header} fixed>
                ~ {new Date().toLocaleString()} ~
            </Text>
            <Text style={styles.title}>Order Invoice</Text>
            <Text style={styles.author}>Ecommerce</Text>
            <Text style={styles.subtitle}>Order Summary</Text>
            <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeader]} fixed>
                    <Text style={styles.tableCell}>Title</Text>
                    <Text style={styles.tableCell}>Price</Text>
                    <Text style={styles.tableCell}>Quantity</Text>
                    <Text style={styles.tableCell}>Brand</Text>
                    <Text style={styles.tableCell}>Color</Text>
                </View>
                {order.products.map(({ product, count }, index) => (
                    <View style={styles.tableRow} key={product._id || index} wrap={false}>
                        <Text style={styles.tableCell}>{product.title}</Text>
                        <Text style={styles.tableCell}>{product.price}</Text>
                        <Text style={styles.tableCell}>{count}</Text>
                        <Text style={styles.tableCell}>{product.brand}</Text>
                        <Text style={styles.tableCell}>{product.color}</Text>
                    </View>
                ))}
            </View>
            <Text style={styles.text}>
                <Text>
                    Date: {"                "}
                    {new Date(order.paymentIntent.created * 1000).toLocaleString()}
                </Text>
                {"\n"}
                <Text>
                    Order Id: {"          "}
                    {order.paymentIntent.id}
                </Text>
                {"\n"}
                <Text>
                    Order Status: {"  "}
                    {order.orderStatus}
                </Text>
                {"\n"}
                <Text>
                    Total Paid: {"       "}
                    {order.paymentIntent.amount}
                    {" THB"}
                </Text>
            </Text>

            <Text style={styles.footer}> ~ ขอบคุณที่ใช้บริการค่ะ ~ </Text>
        </Page>
    </Document>
);

const styles = StyleSheet.create({
    body: {
        paddingTop: 35,
        paddingBottom: 65,
        paddingHorizontal: 35,
        fontFamily: "Roboto"
    },
    title: {
        fontSize: 24,
        textAlign: "center",
    },
    author: {
        fontSize: 12,
        textAlign: "center",
        marginBottom: 40,
    },
    subtitle: {
        fontSize: 18,
        margin: 12,
    },
    text: {
        margin: 12,
        fontSize: 14,
        textAlign: "justify",
    },
    table: {
        borderLeftWidth: 1,
        borderTopWidth: 1,
        borderColor: "#bfbfbf",
    },
    tableRow: {
        flexDirection: "row",
    },
    tableHeader: {
        backgroundColor: "#eeeeee",
        fontWeight: "bold",
    },
    tableCell: {
        width: "20%",
        padding: 5,
        fontSize: 9,
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderColor: "#bfbfbf",
    },
    image: {
        marginVertical: 15,
        marginHorizontal: 100,
    },
    header: {
        fontSize: 12,
        marginBottom: 20,
        textAlign: "center",
        color: "grey",
    },
    footer: {
        padding: "100px",
        fontSize: 12,
        marginBottom: 20,
        textAlign: "center",
        color: "grey",
    },
    pageNumber: {
        position: "absolute",
        fontSize: 12,
        bottom: 30,
        left: 0,
        right: 0,
        textAlign: "center",
        color: "grey",
    },
});

export default Invoice;
