import  {  useEffect, useRef, useState } from "react";

const ScreenCapture= () => {
  const imgRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const wsScreen = useRef();
  const wsControls = useRef();
  const wsMousePosition = useRef();

  const [timeMouseMouved, setTimeMouseMouved] = useState(0);

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const [realScreenSize, setRealScreenSize] = useState({ x: 0, y: 0 });

  useEffect(() => {
    //draw mouse position at mousePosition
    const mousePointer = document.createElement("div");
    mousePointer.style.position = "absolute";
    mousePointer.style.width = "25px";
    mousePointer.style.height = "25px";
    mousePointer.style.backgroundSize = "cover";
    //make the object 0,0 the top left corner
    mousePointer.style.transform = "translate(-50%, -50%)";
    //use cursor-auto.svg from /public as cursor
    mousePointer.style.backgroundImage = "url(/cursor-auto.svg)";

    mousePointer.style.zIndex = "1000";
    mousePointer.style.pointerEvents = "none";

    if (!imgRef.current) {
      return;
    }

    //get imgRef position on screen
    const positionOnScreen= imgRef.current.getBoundingClientRect();
    


    //mousePosition relative to real screen size and img size
    const scaleX = realScreenSize.x / imgRef.current?.width;
    const scaleY = realScreenSize.y / imgRef.current?.height;
    //add imagRef offset to mousePosition2 based on rect + offset of imgRef on screen
    let mousePosition2 = {
      x: mousePosition.x + (imgRef.current.getBoundingClientRect().left),
      y: mousePosition.y + (imgRef.current.getBoundingClientRect().top)
    };

    //mousePosition2.y=mousePosition2.y;
    mousePosition2.x=mousePosition2.x+positionOnScreen.x;
    //add offset of imgRef position on screen




    mousePointer.style.left = `${mousePosition2.x / scaleX}px`;
    mousePointer.style.top = `${mousePosition2.y / scaleY}px`;

    document.body.appendChild(mousePointer);

    return () => {
      document.body.removeChild(mousePointer);
    };
  }, [mousePosition]);

  useEffect(() => {
    const connect = () => {
      wsScreen.current = new WebSocket(
        "ws://macbook-pro-de-olivier.local:8083"
      );
      wsScreen.current.onopen = () => {
        console.log("WebSocket connection established");
        setIsConnected(true);
      };

      wsScreen.current.onmessage = (event) => {
        if (typeof event.data === "string") {
          const message = JSON.parse(event.data);
          if (message.status === "connected") {
            setIsStreaming(true);
          }

          if (message.status === "size") {
            setRealScreenSize({ x: message.width, y: message.height });
          }
        } else {
          const blob = new Blob([event.data], { type: "image/jpeg" });
          const url = URL.createObjectURL(blob);
          if (imgRef.current) {
            imgRef.current.src = url;
          }
        }
      };

      wsScreen.current.onclose = () => {
        console.log("WebSocket connection closed");
        setIsConnected(false);
        setIsStreaming(false);
        connect();
      };
    };

    connect();

    wsControls.current = new WebSocket(
      "ws://macbook-pro-de-olivier.local:8082"
    );
    wsControls.current.onopen = () => {
      console.log("WebSocket connection established");
      setIsConnected(true);
    };

    wsControls.current.onmessage = (event) => {
      if (typeof event.data === "string") {
        const message = JSON.parse(event.data);
        if (message.status === "connected") {
          setIsStreaming(true);
        }
        if (message.status === "mousePosition") {
          setMousePosition({ x: message.x, y: message.y });
          //setIsStreaming(false);
        }
        if (message.status === "size") {
          setRealScreenSize({ x: message.width, y: message.height });
        }
      } else {
        const blob = new Blob([event.data], { type: "image/jpeg" });
        const url = URL.createObjectURL(blob);
        if (imgRef.current) {
          imgRef.current.src = url;
        }
      }
    };

    wsControls.current.onclose = () => {
      console.log("WebSocket connection closed");
      setIsConnected(false);
      setIsStreaming(false);
    };

    wsMousePosition.current = new WebSocket(
      "ws://macbook-pro-de-olivier.local:8081"
    );
    wsMousePosition.current.onopen = () => {
      console.log("WebSocket connection established");
      setIsConnected(true);
    };

    wsMousePosition.current.onmessage = (event) => {
      if (typeof event.data === "string") {
        const message = JSON.parse(event.data);
        if (message.status === "connected") {
          setIsStreaming(true);
        }
        if (message.status === "mousePosition") {
          setMousePosition({ x: message.x, y: message.y });
          //setIsStreaming(false);
        }
      } else {
        const blob = new Blob([event.data], { type: "image/jpeg" });
        const url = URL.createObjectURL(blob);
        if (imgRef.current) {
          imgRef.current.src = url;
        }
      }
    };

    wsMousePosition.current.onclose = () => {
      console.log("WebSocket connection closed");
      setIsConnected(false);
      setIsStreaming(false);
    };

    return () => {
      wsScreen.current?.close();
      wsControls.current?.close();
      wsMousePosition.current?.close();
    };
  }, []);

  useEffect(() => {
    if (imgRef.current) {
      imgRef.current.addEventListener("mousemove", sendMousePosition);
      imgRef.current.addEventListener("wheel", sendMouseScroll);
      imgRef.current.addEventListener("mousedown", sendMouseClick);
      document.addEventListener("keydown", sendKeyDown);
    }

    return () => {
      if (imgRef.current) {
        imgRef.current.removeEventListener("mousemove", sendMousePosition);
        imgRef.current.removeEventListener("wheel", sendMouseScroll);
        imgRef.current.removeEventListener("mousedown", sendMouseClick);
        document.removeEventListener("keydown", sendKeyDown);
      }
    };
  }, [isStreaming, timeMouseMouved, realScreenSize]);

  const sendMousePosition = (event) => {
    if (isStreaming) {
      if (Date.now() - timeMouseMouved > 20) {
        const rect = imgRef.current?.getBoundingClientRect();
        const x = rect ? event.clientX - rect.left : 0;
        const y = rect ? event.clientY - rect.top : 0;

        //scale mouse position to real screen size
        if (!imgRef.current) {
          return;
        }
        console.log(realScreenSize);
        const scaleX = realScreenSize.x / imgRef.current.width;
        const scaleY = realScreenSize.y / imgRef.current.height;

        const mousePosition = { x: x * scaleX, y: y * scaleY };
        const timeinUnix = Date.now();
        wsControls.current?.send(
          JSON.stringify({
            action: "mouseMove",
            x: mousePosition.x,
            y: mousePosition.y,
            time: timeinUnix,
          })
        );
        setTimeMouseMouved(Date.now());
      }
    }
  };

  const sendMouseScroll = (event) => {
    if (isStreaming) {
      wsControls.current?.send(
        JSON.stringify({
          action: "mouseWheel",
          y: event.deltaY,
          x: event.deltaX,
        })
      );
    }
  };

  const sendMouseClick = (event) => {
    if (isStreaming) {
      const rect = imgRef.current?.getBoundingClientRect();
      const x = rect ? event.clientX - rect.left : 0;
      const y = rect ? event.clientY - rect.top : 0;

      //scale mouse position to real screen size
      if (!imgRef.current) {
        return;
      }
      console.log(realScreenSize);
      const scaleX = realScreenSize.x / imgRef.current.width;
      const scaleY = realScreenSize.y / imgRef.current.height;

      const mousePosition = { x: x * scaleX, y: y * scaleY };
      wsControls.current?.send(
        JSON.stringify({
          action: "mouseClick",
          x: mousePosition.x,
          y: mousePosition.y,
        })
      );
    }
  };

  const sendKeyDown = (event) => {
    if (isStreaming) {
      wsControls.current?.send(
        JSON.stringify({ action: "keyDown", key: event.key })
      );
    }
  };

  const startStream = () => {
    wsControls.current?.send(JSON.stringify({ action: "start" }));
    setIsStreaming(true);
  };

  const stopStream = () => {
    wsControls.current?.send(JSON.stringify({ action: "stop" }));
    setIsStreaming(false);
  };

  return (
    <div className="bg-white text-black h-full max-h-screen aspect-video overflow-none">
      {isConnected ? (
        <>
          <img ref={imgRef} className="w-full aspect-video fade-in-out" />
          <div>
            {isStreaming ? (
              <button onClick={stopStream}>Stop Stream</button>
            ) : (
              <button onClick={startStream}>Start Stream</button>
            )}
          </div>
        </>
      ) : (
        <p>Connecting to WebSocket server...</p>
      )}
    </div>
  );
};

export default ScreenCapture;
