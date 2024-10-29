// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {IExternalContract} from "./IExternalContract.sol";
import {Vault} from "./Vault.sol";

/// Complete this Challenge for a chance to win ETH or an interview with Coinbase.
///
/// @dev If using Coinbase Wallet, find your private key in the CB Wallet Chrome Extension
///      (Settings -> Developer Settings > Show private key).
/// @dev Need test funds? https://coinbase.com/faucets

contract DevBounty {
    /// @notice Enum representing the different stages of the challenge
    enum Stage {
        NotStarted,
        CrypticPuzzle,
        ExternalChallenge,
        VaultUnlocking,
        Completed
    }

    /// @notice Struct to store participant information
    struct Participant {
        Stage currentStage;
        uint256 startTime;
        bool hasCompleted;
        address vaultAddress;
    }

    /// @notice Mapping to store participant data
    mapping(address => Participant) public participants;
    /// @notice Array to keep track of all participants
    address[] public participantList;
    /// @notice Array to store addresses of participants who completed the challenge
    address[] public leaderboard;

    /// @notice Hash of the cryptic puzzle solution
    bytes32 public immutable CRYPTIC_PUZZLE_HASH;
    /// @notice Address of the external contract used for challenges
    address public immutable EXTERNAL_CONTRACT;

    /// @notice Emitted when a participant starts the challenge
    event ChallengeStarted(address indexed candidate, string hint);
    /// @notice Emitted when a participant completes a stage
    event StageCompleted(address indexed participant, Stage stage);
    /// @notice Emitted when a participant solves the entire challenge
    event ChallengeSolved(address indexed solver);
    /// @notice Emitted when a new vault is created for a participant
    event VaultCreated(address indexed participant, address vaultAddress);

    /// @notice Constructor to initialize the contract
    /// @param _externalContract Address of the external contract
    constructor(address _externalContract) {
        CRYPTIC_PUZZLE_HASH = 0xf1f3eb40f5bc1ad1344716ced8b8a0431d840b5783aea1fd01786bc26f35ac0f;
        EXTERNAL_CONTRACT = _externalContract;
    }
    /// @notice Starts the challenge for a participant
    /// @dev Creates a new vault and sets the participant's initial stage

    function startChallenge() external {
        require(participants[msg.sender].currentStage == Stage.NotStarted, "Already started");

        IExternalContract(EXTERNAL_CONTRACT).resetSolution(msg.sender);
        IExternalContract(EXTERNAL_CONTRACT).generateSolution(msg.sender);

        uint256 randomNonce = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender))) % 10000;
        bytes32 vaultPassword =
            keccak256(abi.encodePacked(blockhash(block.number - 1), msg.sender, block.timestamp, randomNonce));
        Vault newVault = new Vault(vaultPassword);

        participants[msg.sender] = Participant({
            currentStage: Stage.CrypticPuzzle,
            startTime: block.timestamp,
            hasCompleted: false,
            vaultAddress: address(newVault)
        });

        participantList.push(msg.sender);

        emit ChallengeStarted(msg.sender, "Hint: Coinbase L2");
        emit VaultCreated(msg.sender, address(newVault));
    }

    /// @notice Hint for this stage is Coinbase's L2
    /// @notice Completes the Cryptic Puzzle stage
    /// @dev Verifies the solution and advances the participant to the next stage
    /// @param solution The proposed solution to the cryptic puzzle
    /// @param password The password for verification
    function completeCrypticPuzzle(string calldata solution, address password) external {
        Participant storage participant = participants[msg.sender];
        require(participant.currentStage == Stage.CrypticPuzzle, "Not at Cryptic Puzzle stage");
        require(keccak256(abi.encodePacked(solution)) == CRYPTIC_PUZZLE_HASH, "Incorrect solution");
        require(msg.sender == password, "wrong password");

        participant.currentStage = Stage.ExternalChallenge;
        emit StageCompleted(msg.sender, Stage.CrypticPuzzle);
        emit ChallengeStarted(
            msg.sender, "Hint: Apply a common Solidity hash function to a packed version of the hint."
        );
    }

    /// @notice Completes the External Challenge stage
    /// @dev Checks the solution with the external contract and advances to the next stage
    /// @param solution The proposed solution to the external challenge
    function completeExternalChallenge(bytes32 solution) external {
        Participant storage participant = participants[msg.sender];
        require(participant.currentStage == Stage.ExternalChallenge, "Not at External Challenge stage");

        bool solutionExists = IExternalContract(EXTERNAL_CONTRACT).checkSolutionExists(msg.sender);
        require(solutionExists, "No solution exists");

        bool isCorrect = IExternalContract(EXTERNAL_CONTRACT).checkSolution(msg.sender, bytes32(solution));
        require(isCorrect, "Incorrect solution");

        participant.currentStage = Stage.VaultUnlocking;
        emit StageCompleted(msg.sender, Stage.ExternalChallenge);
        emit ChallengeStarted(msg.sender, "Stage 3: Unlock the Vault");
    }

    /// @notice Completes the Vault Unlocking stage
    /// @dev Verifies that the participant's vault is unlocked and marks the stage as completed
    function completeVaultUnlocking() external {
        Participant storage participant = participants[msg.sender];
        require(participant.currentStage == Stage.VaultUnlocking, "Not at Vault Unlocking stage");

        Vault vault = Vault(participant.vaultAddress);
        require(!vault.locked(), "Vault is still locked");

        participant.currentStage = Stage.Completed;
        emit StageCompleted(msg.sender, Stage.VaultUnlocking);
    }

    /// @notice Completes the entire challenge
    /// @dev Can only be called after all stages are completed
    function completeChallenge() external {
        Participant storage participant = participants[msg.sender];
        require(participant.currentStage == Stage.Completed, "Not at final stage");
        require(!participant.hasCompleted, "Challenge already completed");

        participant.hasCompleted = true;
        leaderboard.push(msg.sender);
        emit ChallengeSolved(msg.sender);
    }
    /// @notice Retrieves the current leaderboard
    /// @return An array of addresses representing the leaderboard

    function getLeaderboard() external view returns (address[] memory) {
        return leaderboard;
    }

    /// @notice Retrieves the list of all participants
    /// @return An array of addresses representing all participants
    function getParticipantList() external view returns (address[] memory) {
        return participantList;
    }

    /// @notice Retrieves the current stage of a participant
    /// @param participant The address of the participant
    /// @return The current stage of the participant
    function getCurrentStage(address participant) external view returns (uint8) {
        return uint8(participants[participant].currentStage);
    }

    /// @notice Retrieves the vault address of a participant
    /// @param participant The address of the participant
    /// @return The address of the participant's vault
    function getVaultAddress(address participant) external view returns (address) {
        return participants[participant].vaultAddress;
    }

    /// @notice Gets a hint for a participant from the external contract
    /// @param participant The address of the participant
    /// @return A uint256 representing the hint
    function getHint(address participant) external view returns (uint256) {
        return IExternalContract(EXTERNAL_CONTRACT).getHint(participant);
    }
}