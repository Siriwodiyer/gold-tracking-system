// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract GoldTracking {
    enum Stage {
        Mining,
        Transport,
        Refining,
        Hallmarking,
        AgencyMelting,
        Manufacturing,
        FinalVerification
    }

    struct GoldBlock {
        uint256 blockId;
        string batchId;
        Stage stage;
        uint256 weightGrams;
        uint256 purityBps; // 9999 = 99.99%
        string location;
        string referenceId;
        string documentCID;
        uint256 parentBlockId;
        uint256 timestamp;
        address actor;
        bytes32 recordHash;
    }

    // Used internally to avoid Solidity "Stack too deep" errors in Remix.
    struct BlockData {
        string batchId;
        Stage stage;
        uint256 weightGrams;
        uint256 purityBps;
        string location;
        string referenceId;
        string documentCID;
    }

    uint256 private nextBlockId = 1;

    mapping(uint256 => GoldBlock) private blocksById;
    mapping(string => uint256[]) private batchBlocks;
    mapping(string => bool) private batchExists;

    // HUID -> final verification block ID
    mapping(string => uint256) private huidToBlockId;

    event GoldBlockCreated(
        uint256 indexed blockId,
        string indexed batchId,
        Stage stage,
        uint256 weightGrams,
        bytes32 recordHash,
        address indexed actor
    );

    modifier validBatch(string memory batchId) {
        require(bytes(batchId).length > 0, "Batch ID is required");
        _;
    }

    // ============================================================
    // 1. MINING
    // ============================================================

    function createMiningBlock(
        string memory batchId,
        uint256 weightGrams,
        string memory location,
        string memory referenceId,
        string memory documentCID
    ) external validBatch(batchId) returns (uint256) {
        require(weightGrams > 0, "Weight must be greater than zero");
        require(!batchExists[batchId], "Batch already exists");

        uint256 id = _createBlock(
            BlockData({
                batchId: batchId,
                stage: Stage.Mining,
                weightGrams: weightGrams,
                purityBps: 0,
                location: location,
                referenceId: referenceId,
                documentCID: documentCID
            })
        );

        batchExists[batchId] = true;

        return id;
    }

    // ============================================================
    // 2. TRANSPORT
    // ============================================================

    function createTransportBlock(
        string memory batchId,
        uint256 weightGrams,
        string memory location,
        string memory referenceId,
        string memory documentCID
    ) external validBatch(batchId) returns (uint256) {
        _requireBatch(batchId);
        _requirePreviousStage(batchId, Stage.Mining);
        _requireWeightNotGreaterThanLatest(batchId, weightGrams);

        return
            _createBlock(
                BlockData({
                    batchId: batchId,
                    stage: Stage.Transport,
                    weightGrams: weightGrams,
                    purityBps: 0,
                    location: location,
                    referenceId: referenceId,
                    documentCID: documentCID
                })
            );
    }

    // ============================================================
    // 3. REFINING
    // ============================================================

    function createRefiningBlock(
        string memory batchId,
        uint256 weightGrams,
        uint256 purityBps,
        string memory location,
        string memory referenceId,
        string memory documentCID
    ) external validBatch(batchId) returns (uint256) {
        _requireBatch(batchId);
        _requirePreviousStage(batchId, Stage.Transport);
        _requireWeightNotGreaterThanLatest(batchId, weightGrams);
        _requirePurity(purityBps);

        return
            _createBlock(
                BlockData({
                    batchId: batchId,
                    stage: Stage.Refining,
                    weightGrams: weightGrams,
                    purityBps: purityBps,
                    location: location,
                    referenceId: referenceId,
                    documentCID: documentCID
                })
            );
    }

    // ============================================================
    // 4. HALLMARKING
    // ============================================================

    function createHallmarkingBlock(
        string memory batchId,
        uint256 weightGrams,
        uint256 purityBps,
        string memory location,
        string memory referenceId,
        string memory documentCID
    ) external validBatch(batchId) returns (uint256) {
        _requireBatch(batchId);
        _requirePreviousStage(batchId, Stage.Refining);
        _requireWeightNotGreaterThanLatest(batchId, weightGrams);
        _requirePurity(purityBps);

        return
            _createBlock(
                BlockData({
                    batchId: batchId,
                    stage: Stage.Hallmarking,
                    weightGrams: weightGrams,
                    purityBps: purityBps,
                    location: location,
                    referenceId: referenceId,
                    documentCID: documentCID
                })
            );
    }

    // ============================================================
    // 5. AGENCY / MELTING
    // ============================================================

    function createAgencyMeltingBlock(
        string memory batchId,
        uint256 weightGrams,
        string memory location,
        string memory referenceId,
        string memory documentCID
    ) external validBatch(batchId) returns (uint256) {
        _requireBatch(batchId);
        _requirePreviousStage(batchId, Stage.Hallmarking);
        _requireWeightNotGreaterThanLatest(batchId, weightGrams);

        return
            _createBlock(
                BlockData({
                    batchId: batchId,
                    stage: Stage.AgencyMelting,
                    weightGrams: weightGrams,
                    purityBps: _latestPurity(batchId),
                    location: location,
                    referenceId: referenceId,
                    documentCID: documentCID
                })
            );
    }

    // ============================================================
    // 6. MANUFACTURING
    // ============================================================

    function createManufacturingBlock(
        string memory batchId,
        uint256 jewelleryWeightGrams,
        string memory jewelleryId,
        string memory location,
        string memory documentCID
    ) external validBatch(batchId) returns (uint256) {
        _requireBatch(batchId);
        _requirePreviousStage(batchId, Stage.AgencyMelting);

        uint256 available = _latestWeight(batchId);

        require(
            jewelleryWeightGrams > 0,
            "Jewellery weight must be greater than zero"
        );

        // Core Mass Balance Rule.
        require(
            jewelleryWeightGrams <= available,
            "Mass Balance Violation: output exceeds available certified gold"
        );

        return
            _createBlock(
                BlockData({
                    batchId: batchId,
                    stage: Stage.Manufacturing,
                    weightGrams: jewelleryWeightGrams,
                    purityBps: _latestPurity(batchId),
                    location: location,
                    referenceId: jewelleryId,
                    documentCID: documentCID
                })
            );
    }

    // ============================================================
    // 7. FINAL HUID VERIFICATION
    // ============================================================

    function createFinalVerificationBlock(
        string memory batchId,
        uint256 jewelleryWeightGrams,
        string memory huid,
        string memory location,
        string memory documentCID
    ) external validBatch(batchId) returns (uint256) {
        _requireBatch(batchId);
        _requirePreviousStage(batchId, Stage.Manufacturing);

        uint256 available = _latestWeight(batchId);

        require(
            jewelleryWeightGrams > 0 &&
                jewelleryWeightGrams <= available,
            "Invalid final weight"
        );

        require(
            bytes(huid).length > 0,
            "HUID is required"
        );

        require(
            huidToBlockId[huid] == 0,
            "HUID already registered"
        );

        uint256 id = _createBlock(
            BlockData({
                batchId: batchId,
                stage: Stage.FinalVerification,
                weightGrams: jewelleryWeightGrams,
                purityBps: _latestPurity(batchId),
                location: location,
                referenceId: huid,
                documentCID: documentCID
            })
        );

        huidToBlockId[huid] = id;

        return id;
    }

    // ============================================================
    // GENERAL READ FUNCTIONS
    // ============================================================

    function getBlock(uint256 blockId)
        external
        view
        returns (GoldBlock memory)
    {
        require(
            blocksById[blockId].blockId != 0,
            "Record not found"
        );

        return blocksById[blockId];
    }

    function getBatchHistory(string memory batchId)
        external
        view
        returns (GoldBlock[] memory)
    {
        require(
            batchExists[batchId],
            "Batch not found"
        );

        uint256[] memory ids = batchBlocks[batchId];

        GoldBlock[] memory history =
            new GoldBlock[](ids.length);

        for (uint256 i = 0; i < ids.length; i++) {
            history[i] = blocksById[ids[i]];
        }

        return history;
    }

    function getLatestBlock(string memory batchId)
        external
        view
        returns (GoldBlock memory)
    {
        require(
            batchExists[batchId],
            "Batch not found"
        );

        uint256[] memory ids = batchBlocks[batchId];

        return blocksById[ids[ids.length - 1]];
    }

    // ============================================================
    // SIMPLE HUID VERIFICATION
    // ============================================================
    // Returns individual values instead of a large GoldBlock tuple.
    // This makes the HUID result much easier to read in Remix.

    function verifyHUID(string memory huid)
        external
        view
        returns (
            bool verified,
            uint256 blockId,
            string memory batchId,
            string memory stage,
            uint256 weightGrams,
            uint256 purityBps,
            string memory location,
            string memory referenceId
        )
    {
        uint256 id = huidToBlockId[huid];

        if (id == 0) {
            return (
                false,
                0,
                "",
                "Not Found",
                0,
                0,
                "",
                ""
            );
        }

        GoldBlock storage b = blocksById[id];

        return (
            true,
            b.blockId,
            b.batchId,
            _stageName(b.stage),
            b.weightGrams,
            b.purityBps,
            b.location,
            b.referenceId
        );
    }

    // ============================================================
    // COMPLETE HUID DOCUMENT DETAILS
    // ============================================================
    // Kept separate to avoid Stack Too Deep errors.

    function getHUIDDocumentDetails(string memory huid)
        external
        view
        returns (
            string memory documentCID,
            uint256 parentBlockId,
            uint256 timestamp,
            address actor,
            bytes32 recordHash
        )
    {
        uint256 id = huidToBlockId[huid];

        require(
            id != 0,
            "HUID not found"
        );

        GoldBlock storage b = blocksById[id];

        return (
            b.documentCID,
            b.parentBlockId,
            b.timestamp,
            b.actor,
            b.recordHash
        );
    }

    // ============================================================
    // INTERNAL BLOCK CREATION
    // ============================================================

    function _createBlock(BlockData memory data)
        internal
        returns (uint256)
    {
        uint256 id = nextBlockId++;

        uint256 parentId =
            _latestId(data.batchId);

        uint256 currentTime =
            block.timestamp;

        bytes32 recordHash =
            keccak256(
                abi.encodePacked(
                    id,
                    data.batchId,
                    uint8(data.stage),
                    data.weightGrams,
                    data.purityBps,
                    data.location,
                    data.referenceId,
                    data.documentCID,
                    parentId,
                    currentTime,
                    msg.sender
                )
            );

        GoldBlock storage item =
            blocksById[id];

        item.blockId = id;
        item.batchId = data.batchId;
        item.stage = data.stage;
        item.weightGrams = data.weightGrams;
        item.purityBps = data.purityBps;
        item.location = data.location;
        item.referenceId = data.referenceId;
        item.documentCID = data.documentCID;
        item.parentBlockId = parentId;
        item.timestamp = currentTime;
        item.actor = msg.sender;
        item.recordHash = recordHash;

        batchBlocks[data.batchId].push(id);

        emit GoldBlockCreated(
            id,
            data.batchId,
            data.stage,
            data.weightGrams,
            recordHash,
            msg.sender
        );

        return id;
    }

    // ============================================================
    // INTERNAL VALIDATION
    // ============================================================

    function _requireBatch(
        string memory batchId
    )
        internal
        view
    {
        require(
            batchExists[batchId],
            "Batch not found"
        );
    }

    function _requirePreviousStage(
        string memory batchId,
        Stage expected
    )
        internal
        view
    {
        uint256 latestId =
            _latestId(batchId);

        require(
            blocksById[latestId].stage == expected,
            "Invalid stage order"
        );
    }

    function _requireWeightNotGreaterThanLatest(
        string memory batchId,
        uint256 weight
    )
        internal
        view
    {
        require(
            weight > 0,
            "Weight must be greater than zero"
        );

        require(
            weight <= _latestWeight(batchId),
            "Weight exceeds available gold"
        );
    }

    function _requirePurity(
        uint256 purityBps
    )
        internal
        pure
    {
        require(
            purityBps > 0 &&
                purityBps <= 10000,
            "Invalid purity"
        );
    }

    // ============================================================
    // INTERNAL DATA HELPERS
    // ============================================================

    function _latestId(
        string memory batchId
    )
        internal
        view
        returns (uint256)
    {
        uint256[] storage ids =
            batchBlocks[batchId];

        if (ids.length == 0) {
            return 0;
        }

        return ids[ids.length - 1];
    }

    function _latestWeight(
        string memory batchId
    )
        internal
        view
        returns (uint256)
    {
        return
            blocksById[
                _latestId(batchId)
            ].weightGrams;
    }

    function _latestPurity(
        string memory batchId
    )
        internal
        view
        returns (uint256)
    {
        return
            blocksById[
                _latestId(batchId)
            ].purityBps;
    }

    // ============================================================
    // STAGE NAME HELPER
    // ============================================================

    function _stageName(
        Stage stage
    )
        internal
        pure
        returns (string memory)
    {
        if (stage == Stage.Mining) {
            return "Mining";
        }

        if (stage == Stage.Transport) {
            return "Transport";
        }

        if (stage == Stage.Refining) {
            return "Refining";
        }

        if (stage == Stage.Hallmarking) {
            return "Hallmarking";
        }

        if (stage == Stage.AgencyMelting) {
            return "Agency / Melting";
        }

        if (stage == Stage.Manufacturing) {
            return "Manufacturing";
        }

        return "Final Verification";
    }
}