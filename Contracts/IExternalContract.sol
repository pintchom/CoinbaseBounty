// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/// @title IExternalContract Interface
/// @notice Interface for an external contract used in challenge verification
interface IExternalContract {
    /// @notice Generates a solution for a participant
    /// @param participant The address of the participant
    function generateSolution(address participant) external;

    /// @notice Checks if the provided solution is correct for a participant
    /// @param participant The address of the participant
    /// @param _answer The proposed solution value
    /// @return bool True if the solution is correct, false otherwise
    function checkSolution(address participant, bytes32 _answer) external view returns (bool);

    /// @notice Resets the solution for a participant
    /// @param participant The address of the participant
    function resetSolution(address participant) external;

    /// @notice Checks if a solution exists for a participant
    /// @param participant The address of the participant
    /// @return bool True if a solution exists, false otherwise
    function checkSolutionExists(address participant) external view returns (bool);

    /// @notice Retrieves a hint for a participant
    /// @param participant The address of the participant
    /// @return uint256 A hint value for the participant
    function getHint(address participant) external view returns (uint256);
}