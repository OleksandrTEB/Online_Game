<?php

namespace App\WebSocket;

use Ratchet\MessageComponentInterface;
use Ratchet\ConnectionInterface;

class WebSocket implements MessageComponentInterface {
    protected \SplObjectStorage $clients;
    private array $players;
    private int $reset;

    public function __construct() {
        $this->clients = new \SplObjectStorage;
        $this->players = [];
        $this->reset = 0;
    }

    public function onOpen(ConnectionInterface $conn): void
    {
        if (count($this->clients) >= 2) return;
        $this->clients->attach($conn);
        echo "Connect: " . count($this->clients) . "\n";
    }

    public function onMessage(ConnectionInterface $from, $msg): void
    {
        if (!$this->clients->contains($from)) return;

        $data = json_decode($msg, true);

        if (isset($data['wont-reset'])) {
            $this->reset++;

            if ($this->reset >= 2) {
                $this->players = [];
                $this->reset = 0;

                foreach ($this->clients as $client) {
                    $client->send(json_encode([
                        'reset' => true,
                    ]));
                }

                return;
            }

            return;
        }

        if (isset($data['section'])) {
            foreach ($this->clients as $client) {
                if ($client !== $from) {
                    $client->send(json_encode([
                        'section' => $data['section'],
                        'currentChar' => $data['currentChar'],
                    ]));
                }
            }

            return;
        }

        if (count($this->clients) > 2) {
            echo "Pidar";
            return;
        }

        if (isset($data['username'])) {
            if (empty($this->players)) {
                $this->players[0] = [
                    'username' => $data['username'],
                    'char' => 'x'
                ];
            } else {
                $this->players[1] = [
                    'username' => $data['username'],
                    'char' => 'o'
                ];
            }
            echo "Players: " . count($this->players) . "\n";
        }

        if (count($this->players) === 2) {
            foreach ($this->clients as $client) {
                $client->send(json_encode([
                    'players' => $this->players,
                ]));
            }
        }
    }

    public function onClose(ConnectionInterface $conn): void
    {
        if (count($this->clients) <= 1) {
            $this->players = [];
            $conn->close();
        };

        $this->clients->detach($conn);

        if (!$this->clients->contains($conn)) return;

        echo "Disconnect:" . count($this->clients) . "\n";
    }

    public function onError(ConnectionInterface $conn, \Exception $e): void
    {
        $this->clients->detach($conn);
    }
}