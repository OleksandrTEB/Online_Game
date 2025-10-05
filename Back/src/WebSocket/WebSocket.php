<?php

namespace App\WebSocket;

use Ratchet\MessageComponentInterface;
use Ratchet\ConnectionInterface;

class WebSocket implements MessageComponentInterface {
    protected \SplObjectStorage $clients;
    private array $players;
    private int $reset;
    private array $clicked_sections;
    private bool $send;
    private int $first;

    public function __construct() {
        $this->clients = new \SplObjectStorage;
        $this->players = [];
        $this->reset = 0;
        $this->clicked_sections = [];
        $this->send = true;
        $this->first = 0;
    }

    public function onOpen(ConnectionInterface $conn): void
    {
        if (count($this->clients) >= 2) return;
        $this->clients->attach($conn);

        if (count($this->players) === 2) {
            foreach ($this->clients as $client) {
                $client->send(json_encode([
                    'players' => $this->players,
                    'canStart' => true
                ]));
            }
        }

        echo "Connect: " . count($this->clients) . "\n";
    }

    public function onMessage(ConnectionInterface $from, $msg): void
    {
        if (!$this->clients->contains($from)) return;

        $data = json_decode($msg, true);

        if (isset($data['win'])) {
            foreach ($this->clients as $client) {
                $client->send(json_encode([
                    "win" => $data['win'],
                ]));
            }

            return;
        }

        if ($this->send) {
            foreach ($this->clients as $client) {
                $client->send(json_encode([
                    'canStep' => true
                ]));
                break;
            }
            $this->send = false;
        }

        if (isset($data['wont-reset'])) {
            $this->reset++;

            if ($this->reset >= 2) {
                $this->players = [];
                $this->reset = 0;
                $this->clicked_sections = [];
                $this->send = true;

                if ($this->first === 0) {
                    $this->first = 1;
                } else {
                    $this->first = 0;
                }

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
            if (!in_array($data['section'], $this->clicked_sections)) {
                $this->clicked_sections[] = $data['section'];
            }
            foreach ($this->clients as $client) {
                if ($client !== $from) {
                    $client->send(json_encode([
                        'section' => $data['section'],
                        'clicked_sections' => $this->clicked_sections,
                        'currentChar' => $data['currentChar'],
                    ]));
                }
            }
            $this->players[0]['canStep'] = !$this->players[0]['canStep'];
            $this->players[1]['canStep'] = !$this->players[1]['canStep'];
            $i = 0;
            foreach ($this->clients as $client) {
                $client->send(json_encode([
                    'canStep' => $this->players[$i]['canStep'],
                ]));
                $i++;
            }

            return;
        }

        if (count($this->clients) > 2) {
            return;
        }

        if (isset($data['username'])) {
            foreach ($this->players as $player) {
                if ($player['username'] === $data['username']) {
                    return;
                }
            }
            if ($this->first === 0) {
                if (empty($this->players)) {
                    $this->players[0] = [
                        'username' => $data['username'],
                        'char' => 'x',
                        'canStep' => true
                    ];
                } else {
                    $this->players[1] = [
                        'username' => $data['username'],
                        'char' => 'o',
                        'canStep' => false
                    ];
                }
            } else {
                if (empty($this->players)) {
                    $this->players[0] = [
                        'username' => $data['username'],
                        'char' => 'o',
                        'canStep' => false
                    ];
                } else {
                    $this->players[1] = [
                        'username' => $data['username'],
                        'char' => 'x',
                        'canStep' => true
                    ];
                }
            }
        }

        if (count($this->players) === 2) {
            foreach ($this->clients as $client) {
                $client->send(json_encode([
                    'players' => $this->players,
                    'canStart' => true
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