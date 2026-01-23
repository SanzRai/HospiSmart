package com.example.hospismart.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class QueueWebSocketController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/queue/update")
    public void handleQueueUpdate(String message) {
        messagingTemplate.convertAndSend("/topic/queue",
                "Queue update received: " + message);
    }

    public void broadcastQueueUpdate(String updateMessage) {
        messagingTemplate.convertAndSend("/topic/queue", updateMessage);
    }
}