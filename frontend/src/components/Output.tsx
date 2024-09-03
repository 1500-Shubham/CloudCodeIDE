
const INSTANCE_URI = "http://localhost:3001";
// final application npm run dev karke run hoga uska

export const Output = () => {
    return <div style={{height: "40vh", background: "white"}}>
        <iframe width={"100%"} height={"100%"} src={`${INSTANCE_URI}`} />
    </div>
}